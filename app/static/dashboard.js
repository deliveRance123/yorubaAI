/**
 * ÀRÒYÉ — Contributor Dashboard Controller
 * Real user authentication, real dynamic level meter, real database metrics, and task submission.
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

// Phrases
const samplePhrases = [
  { yoruba: "Ẹ kú àárọ̀ gbogbo ilé, ṣé àlàáfíà ni ẹ wà?", english: "(Good morning everyone at home, are you all in peace?)" },
  { yoruba: "Ilé-Ifẹ̀ ni orísun àti ìbẹ̀rẹ̀ gbogbo ọmọ Yorùbá.", english: "(Ile-Ife is the origin and source of all Yoruba descendants.)" },
  { yoruba: "Bí ẹ̀mí bá wà, ìrètí ń bẹ.", english: "(As long as there is life, there is hope.)" },
  { yoruba: "Ọmọdé kò mọ egbò, ó ń pè é ní eṣinṣin.", english: "(A child who doesn't know a sore calls it a fly.)" },
  { yoruba: "Àkọ́kọ́ ni ìwà ọmọlúwàbí nínú àṣà Yorùbá.", english: "(Good character is the foremost pillar of Yoruba culture.)" }
];
let phraseIdx = 0;

// Open Modals
document.getElementById('openSpeechModal').addEventListener('click', () => openModal(speechModal));
document.getElementById('openTextModal').addEventListener('click', () => openModal(textModal));
document.getElementById('openKnowledgeModal').addEventListener('click', () => openModal(knowledgeModal));

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});

[speechModal, textModal, knowledgeModal].forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
  });
});

function openModal(modal) {
  closeAllModals();
  modal.classList.add('open');
}

function closeAllModals() {
  [speechModal, textModal, knowledgeModal].forEach(m => m.classList.remove('open'));
  stopRecording();
}

// 4. Recording Logic
micRecordBtn.addEventListener('click', async () => {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
});

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
      micInstruction.textContent = '✅ Ti parí! Ẹ gbọ́ kí ẹ sì firanṣẹ́ sí Approvers.';
    };

    mediaRecorder.start();
    isRecording = true;
    micRecordBtn.classList.add('recording');
    micInstruction.textContent = '🎙️ Ń gba ohùn sílẹ̀... Tẹ bọ́tìnì láti parí.';
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
      alert('🎉 Ẹ ṣeun! A ti fi ohùn rẹ ránṣẹ́ sí ibi-àyẹ̀wò (Sent to Approver review).');
      closeAllModals();
      loadUserDashboard();
      phraseIdx = (phraseIdx + 1) % samplePhrases.length;
      modalTargetSentence.textContent = `"${samplePhrases[phraseIdx].yoruba}"`;
      document.getElementById('modalTargetEnglish').textContent = samplePhrases[phraseIdx].english;
    }
  } catch {
    alert('Àṣìṣe wáyé nígbà tí a ń firanṣẹ́.');
  } finally {
    submitSpeechBtn.disabled = false;
    submitSpeechBtn.textContent = 'Firanṣẹ́ sí Approvers (+50 pts)';
  }
});

// Submit Text Form
document.getElementById('submitTextForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sentence = document.getElementById('textYorubaInput').value.trim();
  const english = document.getElementById('textEnglishInput').value.trim();
  if (!sentence) return;

  try {
    const res = await fetch('/api/community/submit-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence, english, user_id: currentUser.id })
    });
    if (res.ok) {
      alert('📄 Ẹ ṣeun! A ti fi gbolohun rẹ ránṣẹ́ sí Approvers.');
      document.getElementById('submitTextForm').reset();
      closeAllModals();
      loadUserDashboard();
    }
  } catch {
    alert('Àṣìṣe wáyé.');
  }
});

// Submit Knowledge Form
document.getElementById('submitKnowledgeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('knowTitleInput').value.trim();
  const meaning = document.getElementById('knowMeaningInput').value.trim();
  const dialect = document.getElementById('knowDialectSelect').value;
  if (!title || !meaning) return;

  try {
    const res = await fetch('/api/community/submit-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, meaning, dialect, user_id: currentUser.id })
    });
    if (res.ok) {
      alert('📖 Ẹ ṣeun! A ti fi ìmọ̀ àṣà rẹ ránṣẹ́ sí Approvers.');
      document.getElementById('submitKnowledgeForm').reset();
      closeAllModals();
      loadUserDashboard();
    }
  } catch {
    alert('Àṣìṣe wáyé.');
  }
});

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
      let level = 1;
      let levelName = 'Level 1 Contributor';
      let levelSub = 'Beginner Contributor';
      let nextThreshold = 100;
      let percentage = 0;

      if (points < 100) {
        level = 1;
        levelName = 'Level 1 Contributor';
        levelSub = 'Beginner Yoruba Contributor';
        nextThreshold = 100;
        percentage = Math.round((points / 100) * 100);
      } else if (points < 300) {
        level = 2;
        levelName = 'Level 2 Contributor';
        levelSub = 'Dedicated Yoruba Scholar';
        nextThreshold = 300;
        percentage = Math.round(((points - 100) / 200) * 100);
      } else {
        level = 3;
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
        `conic-gradient(var(--primary-orange) 0% ${percentage}%, #E5E7EB ${percentage}% 100%)`;

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
        <td colspan="5" style="text-align: center; color: var(--text-subtle); padding: 30px;">
          Kò tí ì sí iṣẹ́ tí o ti firanṣẹ́. Yan iṣẹ́ kan lókè láti bẹ̀rẹ̀!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    let badgeClass = 'pending';
    let statusText = '⏳ Ní Ìdúró (Pending)';
    if (item.status === 'approved') {
      badgeClass = 'approved';
      statusText = '✅ Tí a Fọwọ́sí (Approved)';
    } else if (item.status === 'rejected') {
      badgeClass = 'rejected';
      statusText = '❌ Tí a Kọ̀ (Rejected)';
    }

    return `
      <tr>
        <td><strong>${escapeHtml(item.type)}</strong></td>
        <td>${escapeHtml(item.content)}</td>
        <td>${escapeHtml(item.date)}</td>
        <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
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
