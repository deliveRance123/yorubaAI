/**
 * ÀRÒYÉ — Approver Dashboard Controller
 * Lead Quality Gatekeeper: Evaluates pending voice recordings and text submissions
 * before they enter the sovereign model brain.
 */

// 1. Enforce Approver Authentication
const userJson = localStorage.getItem('aroye_user');
if (!userJson) {
  window.location.href = '/community/login';
}

const currentUser = JSON.parse(userJson || '{}');
if (currentUser.role !== 'approver') {
  alert('Wíwọlé yìí wà fún àwọn olùfọwọ́sí (Approvers) nìkan.');
  window.location.href = '/community/dashboard';
}

document.getElementById('approverName').textContent = currentUser.name || 'ÀRÒYÉ Approver';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('aroye_user');
  window.location.href = '/community/login';
});

// Refresh button
document.getElementById('refreshQueueBtn').addEventListener('click', loadApproverQueue);

// 2. Load Approver Metrics & Pending Queue
async function loadApproverQueue() {
  try {
    const res = await fetch('/api/approver/queue');
    if (!res.ok) throw new Error('API Error');

    const data = await res.json();

    // Stats
    document.getElementById('apprPendingCount').textContent = data.pending_count || 0;
    document.getElementById('apprApprovedCount').textContent = data.approved_count || 0;
    document.getElementById('apprRejectedCount').textContent = data.rejected_count || 0;
    document.getElementById('apprContributorsCount').textContent = data.contributors_count || 0;

    // Render Queue
    renderQueue(data.items || []);
  } catch (err) {
    console.error('Queue load err:', err);
  }
}

function renderQueue(items) {
  const container = document.getElementById('voiceQueueContainer');

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-queue-box">
        <p>🎉 Kò tí ì sí ohùn tí ó wà ní ìdúró àyẹ̀wò ní báyìí (All submissions reviewed!).</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="review-queue-card" id="queueCard-${item.id}">
      <div class="queue-card-header">
        <div class="queue-speaker-info">
          <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
            ${(item.contributor_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <strong>${escapeHtml(item.contributor_name || 'Olùkópa')}</strong>
            <span style="font-size: 0.74rem; color: var(--text-subtle); display: block;">
              ${item.created_at || 'Just now'} &bull; ${escapeHtml(item.dialect || 'General Yoruba')}
            </span>
          </div>
        </div>
        <span class="status-badge pending">⏳ Pending Review</span>
      </div>

      <div class="queue-target-prompt">
        "${escapeHtml(item.sentence || 'No text provided')}"
      </div>

      <audio controls src="${item.audio_url}" style="width: 100%; border-radius: 8px;"></audio>

      <div class="queue-actions-row">
        <button class="btn-reject" onclick="handleDecision(${item.id}, 'rejected')">
          ❌ Kọ̀ (Noise / Tone Mismatch)
        </button>
        <button class="btn-approve" onclick="handleDecision(${item.id}, 'approved')">
          ✅ Fọwọ́sí fún AI Brain (+₦50 to Contributor)
        </button>
      </div>
    </div>
  `).join('');
}

// 3. Make Decision on Recording
async function handleDecision(recordingId, decision) {
  const card = document.getElementById(`queueCard-${recordingId}`);
  if (card) card.style.opacity = '0.5';

  try {
    const res = await fetch('/api/approver/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording_id: recordingId,
        decision: decision,
        approver_name: currentUser.name || 'Approver'
      })
    });

    if (res.ok) {
      if (decision === 'approved') {
        alert('✅ O ti fọwọ́sí ohùn yìí! A ti kún un sínú AI Brain tí a sì ti fi ₦50 sí àkọọ́lẹ̀ olùkópa náà.');
      } else {
        alert('❌ O ti kọ ohùn náà nítorí ariwo tàbí àmì ohùn.');
      }
      loadApproverQueue();
    }
  } catch (err) {
    alert('Àṣìṣe wáyé nígbà tí a ń fi ìpinnu ránṣẹ́.');
    if (card) card.style.opacity = '1';
  }
}

// Global expose
window.handleDecision = handleDecision;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadApproverQueue);
