-- ==============================================================================
-- YORUBA-NATIVE AI: SOVEREIGN POSTGRESQL DATABASE SCHEMA (NEON)
-- Matches Master Project Specification (Sections 11, 12, 13, 14, 19, 24)
-- ==============================================================================

-- 1. SPEAKERS TABLE
CREATE TABLE IF NOT EXISTS speakers (
    id SERIAL PRIMARY KEY,
    speaker_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    age_group VARCHAR(20) CHECK (age_group IN ('youth', 'adult', 'elder')),
    dialect_variety VARCHAR(50) DEFAULT 'general_yoruba',
    consent_status VARCHAR(20) DEFAULT 'approved' CHECK (consent_status IN ('approved', 'withdrawn', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. VOICE RECORDINGS TABLE (Audio references, never raw audio binaries)
CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    recording_code VARCHAR(50) UNIQUE NOT NULL,
    speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,
    audio_url TEXT NOT NULL,
    sample_rate INTEGER DEFAULT 22050,
    duration_seconds NUMERIC(6, 2),
    channels INTEGER DEFAULT 1,
    audio_format VARCHAR(10) DEFAULT 'wav',
    transcription_status VARCHAR(20) DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'transcribed', 'verified')),
    quality_status VARCHAR(20) DEFAULT 'unreviewed' CHECK (quality_status IN ('unreviewed', 'approved', 'rejected', 'needs_correction')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRANSCRIPTIONS TABLE (Preserves canonical written and spoken elided forms)
CREATE TABLE IF NOT EXISTS transcriptions (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
    formal_text TEXT NOT NULL,
    spoken_contracted_text TEXT,
    has_tone_marks BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HUMAN REVIEWS TABLE (Native-Speaker Linguistic Quality Loop)
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(100),
    pronunciation_score INTEGER CHECK (pronunciation_score BETWEEN 1 AND 5),
    tone_score INTEGER CHECK (tone_score BETWEEN 1 AND 5),
    naturalness_score INTEGER CHECK (naturalness_score BETWEEN 1 AND 5),
    rhythm_score INTEGER CHECK (rhythm_score BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'rejected', 'needs_correction')),
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CULTURAL KNOWLEDGE BASE (Proverbs, Idioms, Cosmology, History)
CREATE TABLE IF NOT EXISTS cultural_knowledge (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('proverb', 'idiom', 'folklore', 'history', 'custom', 'food')),
    yoruba_text TEXT NOT NULL,
    literal_translation TEXT,
    cultural_meaning TEXT NOT NULL,
    cultural_context TEXT,
    verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('verified', 'unverified', 'community_submission')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MODEL CHECKPOINTS REGISTRY (Version control for trained AI weights)
CREATE TABLE IF NOT EXISTS model_checkpoints (
    id SERIAL PRIMARY KEY,
    version_code VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(20) NOT NULL CHECK (model_type IN ('language', 'asr', 'tts')),
    total_parameters BIGINT,
    final_loss NUMERIC(8, 4),
    perplexity NUMERIC(8, 2),
    storage_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for fast retrieval
CREATE INDEX IF NOT EXISTS idx_recordings_speaker ON recordings(speaker_id);
CREATE INDEX IF NOT EXISTS idx_recordings_quality ON recordings(quality_status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_recording ON transcriptions(recording_id);
CREATE INDEX IF NOT EXISTS idx_cultural_category ON cultural_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_checkpoints_type ON model_checkpoints(model_type);
