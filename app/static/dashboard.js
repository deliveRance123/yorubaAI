/**
 * ÀRÒYÉ — Modern Contributor Dashboard Controller
 * Real user authentication, real dynamic level meter, real database metrics, and task submission.
 * Zero Emojis | Pure SVG Icons
 */

// 1. Check Authentication Session
const userJson = localStorage.getItem('aroye_user');
if (!userJson) {
  window.location.href = '/community/login';
}

const currentUser = JSON.parse(userJson || '{}');

// Redirect approver to approver dashboard
if (currentUser.role === 'approver') {
  window.location.href = '/community/approver';
}

// 2. Populate Header & Profile
document.getElementById('userName').textContent = currentUser.name || 'Olùkópa';
document.getElementById('welcomeUserName').textContent = currentUser.name || 'Olùkópa';
document.getElementById('userAvatar').textContent = (currentUser.name || 'U')[0].toUpperCase();
document.getElementById('userDialect').textContent = currentUser.dialect || 'General Yoruba';

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('aroye_user');
  window.location.href = '/community/login';
});

// Mobile Sidebar Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const dashSidebar = document.getElementById('dashSidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    dashSidebar.classList.toggle('open');
    sidebarBackdrop.classList.toggle('active');
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', () => {
    dashSidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('active');
  });
}

// 3. Audio Recorder State
let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let isRecording = false;

const speechModal = document.getElementById('speechModal');
const textModal = document.getElementById('textModal');
const knowledgeModal = document.getElementById('knowledgeModal');

const micRecordBtn = document.getElementById('micRecordBtn');
const micInstruction = document.getElementById('micInstruction');
const audioPreview = document.getElementById('audioPreview');
const submitSpeechBtn = document.getElementById('submitSpeechBtn');
const modalTargetSentence = document.getElementById('modalTargetSentence');
const modalTargetEnglish = document.getElementById('modalTargetEnglish');

// Phrases
const samplePhrases = [
  { yoruba: "Ẹ kú àárọ̀ gbogbo ilé, ṣé àlàáfíà ni ẹ wà?", english: "(Good morning everyone at home, are you all in peace?)" },
  { yoruba: "Ilé-Ifẹ̀ ni orísun àti ìbẹ̀rẹ̀ gbogbo ọmọ Yorùbá.", english: "(Ile-Ife is the origin and source of all Yoruba descendants.)" },
  { yoruba: "Bí ẹ̀mí bá wà, ìrètí ń bẹ.", english: "(As long as there is life, there is hope.)" },
  { yoruba: "Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin.", english: "(A child who doesn't know a sore calls it a fly.)" },
  { yoruba: "Àkọ́kọ́ ni ìwà ọmọlúwàbí nínú àṣà Yorùbá.", english: "(Good character is the foremost pillar of Yoruba culture.)" }
];
let phraseIdx = 0;

// Open Modals from Tasks Grid & Sidebar
const openSpeechBtn = document.getElementById('openSpeechModal');
const openTextBtn = document.getElementById('openTextModal');
const openKnowledgeBtn = document.getElementById('openKnowledgeModal');

const navRecordSpeech = document.getElementById('navRecordSpeech');
const navWriteText = document.getElementById('navWriteText');
const navCulture = document.getElementById('navCulture');

if (openSpeechBtn) openSpeechBtn.addEventListener('click', () => openModal(speechModal));
if (navRecordSpeech) navRecordSpeech.addEventListener('click', () => openModal(speechModal));

if (openTextBtn) openTextBtn.addEventListener('click', () => openModal(textModal));
if (navWriteText) navWriteText.addEventListener('click', () => openModal(textModal));

if (openKnowledgeBtn) openKnowledgeBtn.addEventListener('click', () => openModal(knowledgeModal));
if (navCulture) navCulture.addEventListener('click', () => openModal(knowledgeModal));

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});

[speechModal, textModal, knowledgeModal].forEach(overlay => {
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  }
});

function openModal(modal) {
  closeAllModals();
  if (modal) modal.classList.add('open');
  if (dashSidebar) dashSidebar.classList.remove('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
}

function closeAllModals() {
  [speechModal, textModal, knowledgeModal].forEach(m => {
    if (m) m.classList.remove('open');
  });
  stopRecording();
}

// 4. Recording Logic
if (micRecordBtn) {
  micRecordBtn.addEventListener('click', async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  });
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const url = URL.createObjectURL(recordedBlob);
      audioPreview.src = url;
      audioPreview.style.display = 'block';
      submitSpeechBtn.disabled = false;
      micInstruction.textContent = 'Ohùn ti gba sílẹ̀. Gbọ́ kí o sì firanṣẹ́ sí Approvers.';
    };

    mediaRecorder.start();
    isRecording = true;
    micRecordBtn.classList.add('recording');
    micInstruction.textContent = 'Ń gba ohùn sílẹ̀... Tẹ bọ́tìnì náà lẹ́ẹ̀kan sí i láti parí.';
    audioPreview.style.display = 'none';
    submitSpeechBtn.disabled = true;
  } catch (err) {
    alert('Ẹ fún ẹ̀rọ láyè láti lo maikirofoonu (Microphone access needed).');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    micRecordBtn.classList.remove('recording');
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  }
}

// Submit Speech
if (submitSpeechBtn) {
  submitSpeechBtn.addEventListener('click', async () => {
    if (!recordedBlob) return;
    submitSpeechBtn.disabled = true;
    submitSpeechBtn.textContent = 'Ń gbé e lọ...';

    const formData = new FormData();
    formData.append('audio', recordedBlob, 'yoruba_rec.wav');
    formData.append('sentence', modalTargetSentence.textContent.trim());
    formData.append('user_id', currentUser.id);

    try {
      const res = await fetch('/api/community/submit-speech', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert('A ti fi ohùn rẹ ránṣẹ́ sí Approvers! Wọ́n yóò yẹ̀ ẹ́ wò kí ó tó wọ inú AI Brain.');
        closeAllModals();
        phraseIdx = (phraseIdx + 1) % samplePhrases.length;
        modalTargetSentence.textContent = `"${samplePhrases[phraseIdx].yoruba}"`;
        modalTargetEnglish.textContent = samplePhrases[phraseIdx].english;
        loadUserDashboard();
      } else {
        alert('Àṣìṣe wáyé nígbà tí a ń fi ohùn ránṣẹ́.');
      }
    } catch {
      alert('Àṣìṣe network wáyé.');
    } finally {
      submitSpeechBtn.disabled = false;
      submitSpeechBtn.textContent = 'Firanṣẹ́ sí Approvers (+50 pts)';
      recordedBlob = null;
    }
  });
}

// Submit Text Form
const submitTextForm = document.getElementById('submitTextForm');
if (submitTextForm) {
  submitTextForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const yoruba_text = document.getElementById('yorubaTextInput').value.trim();
    const english_translation = document.getElementById('englishTranslationInput').value.trim();

    try {
      const res = await fetch('/api/community/submit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          yoruba_text,
          english_translation
        })
      });

      if (res.ok) {
        alert('A ti fi gbolohun rẹ ránṣẹ́ sí ibi-àtúnyẹ̀wò Approvers!');
        submitTextForm.reset();
        closeAllModals();
        loadUserDashboard();
      }
    } catch {
      alert('Àṣìṣe wáyé.');
    }
  });
}

// Submit Cultural Knowledge Form
const submitKnowledgeForm = document.getElementById('submitKnowledgeForm');
if (submitKnowledgeForm) {
  submitKnowledgeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const proverb = document.getElementById('proverbInput').value.trim();
    const meaning = document.getElementById('meaningInput').value.trim();
    const category = document.getElementById('categorySelect').value;

    try {
      const res = await fetch('/api/community/submit-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          proverb,
          meaning,
          category
        })
      });

      if (res.ok) {
        alert('Ẹ ṣeun! A ti fi ìmọ̀ àṣà rẹ ránṣẹ́ sí Approvers.');
        submitKnowledgeForm.reset();
        closeAllModals();
        loadUserDashboard();
      }
    } catch {
      alert('Àṣìṣe wáyé.');
    }
  });
}

// 5. Load Real User Metrics & Dynamic Level Reading (NO FAKE NUMBERS!)
async function loadUserDashboard() {
  try {
    const res = await fetch(`/api/contributor/my-data?user_id=${currentUser.id}`);
    if (res.ok) {
      const data = await res.json();
      
      const points = data.points || 0;
      const earnings = Number(data.earnings || 0);

      // Header pills
      document.getElementById('headerPoints').textContent = `${points} pts`;
      document.getElementById('headerEarnings').textContent = `₦${earnings.toFixed(2)}`;

      // Stats boxes
      document.getElementById('mySpeechCount').textContent = data.speech_count || 0;
      document.getElementById('myTextCount').textContent = data.text_count || 0;
      document.getElementById('myApprovedCount').textContent = data.approved_count || 0;
      document.getElementById('myPendingCount').textContent = data.pending_count || 0;

      // Real Dynamic Level Calculation
      let levelName = 'Level 1 Contributor';
      let levelSub = 'Beginner Contributor';
      let nextThreshold = 100;
      let percentage = 0;

      if (points < 100) {
        levelName = 'Level 1 Contributor';
        levelSub = 'Beginner Yoruba Contributor';
        nextThreshold = 100;
        percentage = Math.round((points / 100) * 100);
      } else if (points < 300) {
        levelName = 'Level 2 Contributor';
        levelSub = 'Dedicated Yoruba Scholar';
        nextThreshold = 300;
        percentage = Math.round(((points - 100) / 200) * 100);
      } else {
        levelName = 'Level 3 Contributor';
        levelSub = 'Master Yoruba Linguist';
        nextThreshold = 600;
        percentage = Math.min(100, Math.round(((points - 300) / 300) * 100));
      }

      document.getElementById('levelTitle').textContent = levelName;
      document.getElementById('levelSubtitle').textContent = levelSub;
      document.getElementById('levelPointsRatio').textContent = `${points} / ${nextThreshold} points to next Level`;
      document.getElementById('levelPercentage').textContent = `${percentage}%`;
      
      // Update radial gradient dynamically
      document.getElementById('radialMeter').style.background = 
        `conic-gradient(var(--primary-orange) 0% ${percentage}%, #E2E8F0 ${percentage}% 100%)`;

      // Render Submissions Table
      renderSubmissionsTable(data.submissions || []);
    }
  } catch (err) {
    console.error('Failed to load user metrics:', err);
  }
}

function renderSubmissionsTable(list) {
  const tbody = document.getElementById('mySubmissionsTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-subtle); padding: 36px 20px;">
          Kò tí ì sí iṣẹ́ tí o ti firanṣẹ́. Yan iṣẹ́ kan lókè láti bẹ̀rẹ̀!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    let badgeClass = 'pending';
    let statusText = 'Pending Review';
    let statusIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

    if (item.status === 'approved') {
      badgeClass = 'approved';
      statusText = 'Approved';
      statusIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (item.status === 'rejected') {
      badgeClass = 'rejected';
      statusText = 'Rejected';
      statusIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    return `
      <tr>
        <td><strong>${escapeHtml(item.type)}</strong></td>
        <td>${escapeHtml(item.content)}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>
          <span class="status-badge ${badgeClass}">
            ${statusIcon}
            <span>${statusText}</span>
          </span>
        </td>
        <td><strong>${item.points ? '+' + item.points + ' pts' : 'Pending'}</strong></td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadUserDashboard);
