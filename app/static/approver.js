/**
 * ÀRÒYÉ — Modern Approver Dashboard Controller
 * Lead Quality Gatekeeper: Evaluates pending voice recordings and text submissions
 * before they enter the sovereign model brain.
 * Zero Emojis | Pure SVG Icons
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

// Refresh button
document.getElementById('refreshQueueBtn').addEventListener('click', loadApproverQueue);

// 2. Load Approver Metrics & Pending Queue
async function loadApproverQueue() {
  try {
    const res = await fetch('/api/approver/queue');
    if (!res.ok) throw new Error('API Error');

    const data = await res.json();

    // Stats
    const pending = data.pending_count || 0;
    document.getElementById('apprPendingCount').textContent = pending;
    document.getElementById('apprApprovedCount').textContent = data.approved_count || 0;
    document.getElementById('apprRejectedCount').textContent = data.rejected_count || 0;
    document.getElementById('apprContributorsCount').textContent = data.contributors_count || 0;

    // Sidebar counter pill
    const sidebarBadge = document.getElementById('sidebarPendingCount');
    if (sidebarBadge) sidebarBadge.textContent = pending;

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
        <svg class="empty-queue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12h8"/>
        </svg>
        <p>Kò tí ì sí ohùn tí ó wà ní ìdúró àyẹ̀wò ní báyìí (All submissions reviewed!).</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="review-queue-card" id="queueCard-${item.id}">
      <div class="queue-card-header">
        <div class="queue-speaker-info">
          <div class="queue-speaker-avatar">
            ${(item.contributor_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <strong class="queue-speaker-name">${escapeHtml(item.contributor_name || 'Olùkópa')}</strong>
            <span class="queue-speaker-meta">
              ${item.created_at || 'Just now'} &bull; ${escapeHtml(item.dialect || 'General Yoruba')}
            </span>
          </div>
        </div>
        <span class="status-badge pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Pending Review</span>
        </span>
      </div>

      <div class="queue-target-prompt">
        "${escapeHtml(item.sentence || 'No text provided')}"
      </div>

      <audio controls src="${item.audio_url}" style="width: 100%; border-radius: 8px;"></audio>

      <div class="queue-actions-row">
        <button class="btn-queue-reject" onclick="handleDecision(${item.id}, 'rejected')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span>Kọ̀ (Noise / Tone Mismatch)</span>
        </button>
        <button class="btn-queue-approve" onclick="handleDecision(${item.id}, 'approved')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Fọwọ́sí fún AI Brain (+₦50)</span>
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
        alert('A ti fọwọ́sí ohùn yìí! A ti kún un sínú AI Brain tí a sì ti fi ₦50 sí àkọọ́lẹ̀ olùkópa náà.');
      } else {
        alert('A ti kọ ohùn náà nítorí ariwo tàbí àmì ohùn tí kò péye.');
      }
      loadApproverQueue();
    } else {
      alert('Àṣìṣe wáyé nígbà tí a ń fi ìpinnu ránṣẹ́.');
      if (card) card.style.opacity = '1';
    }
  } catch (err) {
    alert('Àṣìṣe network wáyé.');
    if (card) card.style.opacity = '1';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadApproverQueue);
