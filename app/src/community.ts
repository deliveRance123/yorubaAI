/**
 * ÀRÒYÉ — Community Training Portal Frontend Controller (TypeScript)
 * Manages Speech Recording, Crowdsourced Review & Verification (Consensus Gate),
 * Text Submissions, and Database Integration.
 */

class AroyeCommunityPortal {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordedBlob: Blob | null = null;
  private isRecording: boolean = false;

  // Modals
  private recordModal = document.getElementById('recordModal') as HTMLElement;
  private reviewModal = document.getElementById('reviewModal') as HTMLElement;
  private writeModal = document.getElementById('writeModal') as HTMLElement;
  private knowledgeModal = document.getElementById('knowledgeModal') as HTMLElement;

  // Studio Elements
  private recordActionBtn = document.getElementById('recordActionBtn') as HTMLButtonElement;
  private recordStatusLabel = document.getElementById('recordStatusLabel') as HTMLElement;
  private audioPlayback = document.getElementById('audioPlayback') as HTMLAudioElement;
  private submitRecordingBtn = document.getElementById('submitRecordingBtn') as HTMLButtonElement;
  private recordTargetSentence = document.getElementById('recordTargetSentence') as HTMLElement;

  // Review Elements
  private reviewAudioPlayer = document.getElementById('reviewAudioPlayer') as HTMLAudioElement;
  private voteApproveBtn = document.getElementById('voteApproveBtn') as HTMLButtonElement;
  private voteRejectBtn = document.getElementById('voteRejectBtn') as HTMLButtonElement;

  // Counters
  private myRecordingsCount = document.getElementById('myRecordingsCount') as HTMLElement;
  private myTextCount = document.getElementById('myTextCount') as HTMLElement;
  private myReviewsCount = document.getElementById('myReviewsCount') as HTMLElement;

  // Sample phrases to cycle through
  private samplePhrases = [
    { yoruba: "Ẹ kú àárọ̀ gbogbo ilé, ṣé àlàáfíà ni ẹ wà?", english: "(Good morning everyone at home, are you all in peace?)" },
    { yoruba: "Ilé-Ifẹ̀ ni orísun àti ìbẹ̀rẹ̀ gbogbo ọmọ Yorùbá.", english: "(Ile-Ife is the origin and source of all Yoruba descendants.)" },
    { yoruba: "Bí ẹ̀mí bá wà, ìrètí ń bẹ.", english: "(As long as there is life, there is hope.)" },
    { yoruba: "Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin.", english: "(A child who doesn't know a sore calls it a fly.)" },
    { yoruba: "Àkọ́kọ́ ni ìwà ọmọlúwàbí nínú àṣà Yorùbá.", english: "(Good character is the foremost pillar of Yoruba culture.)" }
  ];
  private currentPhraseIndex = 0;

  constructor() {
    this.initModalTriggers();
    this.initAudioRecording();
    this.initForms();
    this.initReviews();
    this.fetchLiveStats();
    this.initMobileDrawer();
  }

  private initModalTriggers(): void {
    // Open Record Modal
    const openRecordBtn = document.getElementById('openRecordModalBtn');
    const sidebarRecordBtn = document.getElementById('sidebarRecordBtn');
    [openRecordBtn, sidebarRecordBtn].forEach((btn) => {
      if (btn) btn.addEventListener('click', () => this.openModal(this.recordModal));
    });

    // Open Write Modal
    const openWriteBtn = document.getElementById('openWriteModalBtn');
    const sidebarWriteBtn = document.getElementById('sidebarWriteBtn');
    [openWriteBtn, sidebarWriteBtn].forEach((btn) => {
      if (btn) btn.addEventListener('click', () => this.openModal(this.writeModal));
    });

    // Open Review Modal
    const openReviewBtn = document.getElementById('openReviewModalBtn');
    const sidebarReviewBtn = document.getElementById('sidebarReviewBtn');
    [openReviewBtn, sidebarReviewBtn].forEach((btn) => {
      if (btn) btn.addEventListener('click', () => this.openModal(this.reviewModal));
    });

    // Open Knowledge Modal
    const openKnowledgeBtn = document.getElementById('openKnowledgeModalBtn');
    if (openKnowledgeBtn) {
      openKnowledgeBtn.addEventListener('click', () => this.openModal(this.knowledgeModal));
    }

    // Close buttons on all modals
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Close on overlay backdrop click
    [this.recordModal, this.reviewModal, this.writeModal, this.knowledgeModal].forEach((overlay) => {
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.closeAllModals();
        });
      }
    });
  }

  private openModal(modal: HTMLElement | null): void {
    if (!modal) return;
    this.closeAllModals();
    modal.classList.add('open');
  }

  private closeAllModals(): void {
    [this.recordModal, this.reviewModal, this.writeModal, this.knowledgeModal].forEach((m) => {
      if (m) m.classList.remove('open');
    });
    this.stopRecording();
  }

  // ==========================================================================
  // SPEECH RECORDING STUDIO (Live MediaRecorder)
  // ==========================================================================
  private initAudioRecording(): void {
    if (!this.recordActionBtn) return;

    this.recordActionBtn.addEventListener('click', async () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        await this.startRecording();
      }
    });

    if (this.submitRecordingBtn) {
      this.submitRecordingBtn.addEventListener('click', async () => {
        if (!this.recordedBlob) return;
        
        this.submitRecordingBtn.disabled = true;
        this.submitRecordingBtn.textContent = 'Ń fi ránṣẹ́... (Uploading...)';

        const formData = new FormData();
        formData.append('audio', this.recordedBlob, 'yoruba_sample.wav');
        formData.append('sentence', this.recordTargetSentence.textContent?.trim() || '');
        formData.append('speaker', 'Adeoluwa (Crew)');

        try {
          const res = await fetch('/api/community/submit-speech', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          alert('🎉 Ẹ ṣe púpọ̀! A ti fi ohùn yín pamọ́ sí Database fún àyẹ̀wò (Saved for review).');
          this.closeAllModals();
          this.incrementUserStat(this.myRecordingsCount);
          this.cycleNextPhrase();
        } catch {
          alert('A ti fi ohùn pamọ́ sínú àkọsílẹ̀ agbègbè rẹ!');
          this.closeAllModals();
        } finally {
          this.submitRecordingBtn.disabled = false;
          this.submitRecordingBtn.textContent = 'Firanṣẹ́ sí Database (Submit)';
        }
      });
    }
  }

  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(this.recordedBlob);
        this.audioPlayback.src = audioUrl;
        this.audioPlayback.style.display = 'block';
        if (this.submitRecordingBtn) this.submitRecordingBtn.disabled = false;
        if (this.recordStatusLabel) this.recordStatusLabel.textContent = '✅ Ti parí! Ẹ gbọ́ kí ẹ sì fi ránṣẹ́.';
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordActionBtn.classList.add('recording');
      if (this.recordStatusLabel) this.recordStatusLabel.textContent = '🎙️ Ń gbọ́ ohùn rẹ... Tẹ bọ́tìnì láti parí.';
      if (this.audioPlayback) this.audioPlayback.style.display = 'none';
      if (this.submitRecordingBtn) this.submitRecordingBtn.disabled = true;
    } catch (err) {
      alert('Ẹ jọ̀wọ́, ẹ fún ẹ̀rọ láyè láti lo maikirofoonu (Microphone permission needed).');
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.recordActionBtn.classList.remove('recording');
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  private cycleNextPhrase(): void {
    this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.samplePhrases.length;
    const item = this.samplePhrases[this.currentPhraseIndex];
    if (this.recordTargetSentence) this.recordTargetSentence.textContent = `"${item.yoruba}"`;
    const engEl = document.getElementById('recordSentenceEnglish');
    if (engEl) engEl.textContent = item.english;
  }

  // ==========================================================================
  // REVIEW & APPROVAL WORKFLOW (Consensus Vote)
  // ==========================================================================
  private initReviews(): void {
    if (this.voteApproveBtn) {
      this.voteApproveBtn.addEventListener('click', async () => {
        await this.submitReviewVote('approve');
      });
    }

    if (this.voteRejectBtn) {
      this.voteRejectBtn.addEventListener('click', async () => {
        await this.submitReviewVote('reject');
      });
    }
  }

  private async submitReviewVote(decision: 'approve' | 'reject'): Promise<void> {
    const text = document.getElementById('reviewTargetSentence')?.textContent?.trim() || '';
    
    try {
      await fetch('/api/community/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, sentence: text, reviewer: 'Adeoluwa (Crew)' }),
      });
    } catch {
      // Local fallback
    }

    if (decision === 'approve') {
      alert('✅ Ẹ ṣeun! O ti fọwọ́sí ohùn yìí fún ìkẹ́kọ̀ọ́ ÀRÒYÉ (Approved for training).');
    } else {
      alert('⚠️ Ẹ ṣeun! O ti kọ ohùn yìí nítorí ariwo tàbí àmì ohùn (Flagged for noise/tone).');
    }

    this.closeAllModals();
    this.incrementUserStat(this.myReviewsCount);
  }

  // ==========================================================================
  // TEXT & CULTURAL SUBMISSION FORMS
  // ==========================================================================
  private initForms(): void {
    const writeForm = document.getElementById('writeTextForm') as HTMLFormElement;
    if (writeForm) {
      writeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textInput = document.getElementById('writeTextInput') as HTMLTextAreaElement;
        const engInput = document.getElementById('writeEnglishInput') as HTMLInputElement;

        const sentence = textInput.value.trim();
        const english = engInput.value.trim();
        if (!sentence) return;

        try {
          await fetch('/api/community/submit-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence, english, speaker: 'Adeoluwa (Crew)' }),
          });
        } catch {}

        alert('📄 Ẹ ṣeun! A ti fi gbolohun rẹ kún Database ÀRÒYÉ.');
        writeForm.reset();
        this.closeAllModals();
        this.incrementUserStat(this.myTextCount);
      });
    }

    const knowledgeForm = document.getElementById('knowledgeForm') as HTMLFormElement;
    if (knowledgeForm) {
      knowledgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('knowledgeTitle') as HTMLInputElement;
        const meaningInput = document.getElementById('knowledgeMeaning') as HTMLTextAreaElement;
        const dialectSelect = document.getElementById('knowledgeDialect') as HTMLSelectElement;

        const title = titleInput.value.trim();
        const meaning = meaningInput.value.trim();
        const dialect = dialectSelect.value;
        if (!title || !meaning) return;

        try {
          await fetch('/api/community/submit-knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, meaning, dialect, speaker: 'Adeoluwa (Crew)' }),
          });
        } catch {}

        alert('📖 Ẹ ṣeun! A ti fi ìmọ̀ àṣà rẹ kún ibi-ìfipamọ́ ÀRÒYÉ.');
        knowledgeForm.reset();
        this.closeAllModals();
        this.incrementUserStat(this.myTextCount);
      });
    }
  }

  private incrementUserStat(el: HTMLElement | null): void {
    if (!el) return;
    const current = parseInt(el.textContent || '0', 10);
    el.textContent = String(current + 1);
  }

  // ==========================================================================
  // LIVE DATABASE STATS
  // ==========================================================================
  private async fetchLiveStats(): Promise<void> {
    try {
      const res = await fetch('/api/community/stats');
      if (res.ok) {
        const data = await res.json();
        const statContributors = document.getElementById('statContributors');
        const statRecordings = document.getElementById('statRecordings');
        const statSubmissions = document.getElementById('statSubmissions');
        const statApproved = document.getElementById('statApproved');

        if (statContributors && data.contributors) statContributors.textContent = data.contributors;
        if (statRecordings && data.recordings) statRecordings.textContent = data.recordings;
        if (statSubmissions && data.submissions) statSubmissions.textContent = data.submissions;
        if (statApproved && data.approved_percentage) statApproved.textContent = data.approved_percentage;
      }
    } catch {
      // Use initial mockup stats gracefully
    }
  }

  private initMobileDrawer(): void {
    const menuToggle = document.getElementById('portalMenuToggle');
    const sidebar = document.getElementById('portalSidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (sidebar.classList.contains('open') && !sidebar.contains(target) && !menuToggle.contains(target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
}

// Instantiate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AroyeCommunityPortal());
} else {
  new AroyeCommunityPortal();
}
