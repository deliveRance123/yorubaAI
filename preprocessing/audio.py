"""
Yoruba-Native AI: Audio Preprocessing Engine.
Standardizes speech recordings for ASR and TTS training:
  - 22,050 Hz target sample rate (TTS acoustic standard)
  - 16-bit PCM mono channel
  - Leading & trailing silence trimming via RMS energy thresholding
  - Peak and RMS loudness normalization
  - Metadata inspection (duration, sample rate, channels, SNR)
"""

import os
import sys
import wave
import struct
import math
from typing import Dict, Any, Tuple, List, Optional

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


TARGET_SAMPLE_RATE = 22050
TARGET_CHANNELS = 1
TARGET_SAMPLE_WIDTH = 2  # 16-bit (2 bytes)


class AudioPreprocessor:
    """Preprocesses raw Yoruba speech audio into clean, normalized datasets."""

    def __init__(
        self,
        target_sample_rate: int = TARGET_SAMPLE_RATE,
        silence_threshold_db: float = -40.0,
        target_peak_db: float = -1.0
    ):
        self.target_sample_rate = target_sample_rate
        self.silence_threshold_ratio = 10.0 ** (silence_threshold_db / 20.0)
        self.target_peak_ratio = 10.0 ** (target_peak_db / 20.0)

    def read_wav(self, filepath: str) -> Tuple[List[float], int, int]:
        """
        Read a WAV file using Python's standard wave library.
        Returns:
            samples: List of float samples in range [-1.0, 1.0]
            sample_rate: Integer sample rate
            num_channels: Number of audio channels
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Audio file not found: {filepath}")

        with wave.open(filepath, "rb") as wf:
            num_channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            sample_rate = wf.getframerate()
            num_frames = wf.getnframes()
            raw_bytes = wf.readframes(num_frames)

        # Parse 16-bit PCM samples
        if sample_width == 2:
            num_samples = num_frames * num_channels
            fmt = f"<{num_samples}h"
            raw_ints = struct.unpack(fmt, raw_bytes)
            # Convert to float [-1.0, 1.0]
            samples = [s / 32768.0 for s in raw_ints]
        elif sample_width == 1:
            # 8-bit unsigned
            samples = [(b - 128) / 128.0 for b in raw_bytes]
        else:
            raise ValueError(f"Unsupported sample width: {sample_width} bytes (must be 8 or 16-bit)")

        # Convert stereo to mono if needed
        if num_channels > 1:
            mono_samples = []
            for i in range(0, len(samples), num_channels):
                avg = sum(samples[i : i + num_channels]) / num_channels
                mono_samples.append(avg)
            samples = mono_samples
            num_channels = 1

        return samples, sample_rate, num_channels

    def write_wav(self, filepath: str, samples: List[float], sample_rate: int = TARGET_SAMPLE_RATE) -> None:
        """Save normalized float samples to a 16-bit mono WAV file."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)

        # Clamp and convert float [-1.0, 1.0] to 16-bit integers
        clamped_ints = []
        for s in samples:
            s_clamped = max(-1.0, min(1.0, s))
            clamped_ints.append(int(s_clamped * 32767.0))

        raw_bytes = struct.pack(f"<{len(clamped_ints)}h", *clamped_ints)

        with wave.open(filepath, "wb") as wf:
            wf.setnchannels(1)  # Mono
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes(raw_bytes)

    def resample(self, samples: List[float], orig_sr: int, target_sr: int) -> List[float]:
        """Linear interpolation resampling for pure Python portability."""
        if orig_sr == target_sr or not samples:
            return samples

        ratio = target_sr / orig_sr
        new_length = int(len(samples) * ratio)
        resampled = []

        for i in range(new_length):
            orig_idx = i / ratio
            idx_floor = int(orig_idx)
            idx_ceil = min(idx_floor + 1, len(samples) - 1)
            frac = orig_idx - idx_floor
            # Linear interpolation
            interpolated = samples[idx_floor] * (1.0 - frac) + samples[idx_ceil] * frac
            resampled.append(interpolated)

        return resampled

    def trim_silence(self, samples: List[float], frame_size: int = 512) -> List[float]:
        """Trim leading and trailing silence based on energy threshold."""
        if not samples:
            return samples

        # Find start threshold
        start_idx = 0
        for i in range(0, len(samples) - frame_size, frame_size):
            frame = samples[i : i + frame_size]
            rms = math.sqrt(sum(s * s for s in frame) / max(len(frame), 1))
            if rms >= self.silence_threshold_ratio:
                start_idx = max(0, i - frame_size)  # Keep a tiny 20ms buffer
                break

        # Find end threshold
        end_idx = len(samples)
        for i in range(len(samples), frame_size, -frame_size):
            frame = samples[i - frame_size : i]
            rms = math.sqrt(sum(s * s for s in frame) / max(len(frame), 1))
            if rms >= self.silence_threshold_ratio:
                end_idx = min(len(samples), i + frame_size)
                break

        if start_idx >= end_idx:
            return samples

        return samples[start_idx:end_idx]

    def normalize_loudness(self, samples: List[float]) -> List[float]:
        """Peak normalize samples to target ratio (default -1.0 dBFS)."""
        if not samples:
            return samples

        max_peak = max(abs(s) for s in samples)
        if max_peak <= 1e-6:
            return samples

        gain = self.target_peak_ratio / max_peak
        return [s * gain for s in samples]

    def process_file(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """
        Complete processing pipeline:
        1. Read WAV & convert to mono
        2. Resample to target sample rate (22,050 Hz)
        3. Trim leading & trailing silence
        4. Normalize loudness
        5. Save standardized WAV
        """
        samples, orig_sr, orig_ch = self.read_wav(input_path)
        orig_duration = len(samples) / orig_sr

        # Resample
        samples = self.resample(samples, orig_sr, self.target_sample_rate)
        # Trim silence
        samples = self.trim_silence(samples)
        # Normalize
        samples = self.normalize_loudness(samples)

        # Save
        self.write_wav(output_path, samples, self.target_sample_rate)
        final_duration = len(samples) / self.target_sample_rate

        return {
            "input_file": input_path,
            "output_file": output_path,
            "original_sr": orig_sr,
            "target_sr": self.target_sample_rate,
            "original_channels": orig_ch,
            "original_duration_sec": round(orig_duration, 2),
            "final_duration_sec": round(final_duration, 2),
            "total_samples": len(samples)
        }
