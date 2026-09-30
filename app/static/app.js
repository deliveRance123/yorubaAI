/**
 * ÀRÒYÉ — Sovereign Yoruba AI (TypeScript Frontend Architecture)
 * Unified Chat + Voice, ChatGPT-style Collapsing Sidebar, Three-Dots Menu, & History
 */
class AroyeApp {
    activeTab = 'chat';
    messages = [];
    history = [];
    isSidebarCollapsed = false;
    isVoiceActive = false;
    recognition = null;
    // DOM Elements
    sidebar;
    appLayout;
    chatViewport;
    heroWelcome;
    messagesContainer;
    chatForm;
    userInput;
    micBtn;
    collapseBtn;
    searchInput;
    moreMenuBtn;
    moreDropdown;
    historyList;
    clearHistoryBtn;
    constructor() {
        this.initElements();
        this.loadState();
        this.initSidebar();
        this.initTabs();
        this.initVoice();
        this.initDiacritics();
        this.initChat();
        this.initHeaderMenu();
    }
    initElements() {
        this.sidebar = document.getElementById('sidebar');
        this.appLayout = document.getElementById('appLayout');
        this.chatViewport = document.getElementById('chatViewport');
        this.heroWelcome = document.getElementById('heroWelcome');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatForm = document.getElementById('chatForm');
        this.userInput = document.getElementById('userInput');
        this.micBtn = document.getElementById('micBtn');
        this.collapseBtn = document.getElementById('collapseSidebarBtn');
        this.searchInput = document.getElementById('chatSearchInput');
        this.moreMenuBtn = document.getElementById('moreMenuBtn');
        this.moreDropdown = document.getElementById('moreDropdown');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }
    loadState() {
        // Load sidebar preference
        const savedCollapse = localStorage.getItem('aroye_sidebar_collapsed');
        if (savedCollapse === 'true') {
            this.isSidebarCollapsed = true;
            this.sidebar.classList.add('collapsed');
            this.appLayout.classList.add('sidebar-collapsed');
        }
        // Load conversation history
        const savedHistory = localStorage.getItem('aroye_history');
        if (savedHistory) {
            try {
                this.history = JSON.parse(savedHistory);
            }
            catch {
                this.history = [];
            }
        }
    }
    // ==========================================================================
    // 1. SIDEBAR COLLAPSE / EXPAND (ChatGPT Mini Rail Style)
    // ==========================================================================
    initSidebar() {
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        const expandSidebarBtn = document.getElementById('expandSidebarBtn');
        if (expandSidebarBtn) {
            expandSidebarBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        const brandLogo = document.getElementById('brandLogo');
        if (brandLogo) {
            brandLogo.addEventListener('click', () => {
                if (this.isSidebarCollapsed) {
                    this.toggleSidebar();
                }
            });
        }
        // Mobile drawer toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('open');
            });
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (this.sidebar.classList.contains('open') && !this.sidebar.contains(target) && !menuToggle.contains(target)) {
                    this.sidebar.classList.remove('open');
                }
            });
        }
    }
    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        if (this.isSidebarCollapsed) {
            this.sidebar.classList.add('collapsed');
            this.appLayout.classList.add('sidebar-collapsed');
            this.collapseBtn.setAttribute('title', 'Expand sidebar');
        }
        else {
            this.sidebar.classList.remove('collapsed');
            this.appLayout.classList.remove('sidebar-collapsed');
            this.collapseBtn.setAttribute('title', 'Collapse sidebar');
        }
        localStorage.setItem('aroye_sidebar_collapsed', String(this.isSidebarCollapsed));
    }
    // ==========================================================================
    // 2. TAB SWITCHING (Chat, History, Settings)
    // ==========================================================================
    initTabs() {
        const navButtons = document.querySelectorAll('[data-tab]');
        navButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                if (tab)
                    this.switchTab(tab);
            });
        });
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Ṣé o dá ẹ lójú pé o fẹ́ pa gbogbo àkọsílẹ̀ rẹ́?')) {
                    this.history = [];
                    localStorage.removeItem('aroye_history');
                    this.renderHistory();
                }
            });
        }
    }
    switchTab(tab) {
        this.activeTab = tab;
        // Update nav active classes
        document.querySelectorAll('[data-tab]').forEach((btn) => {
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            }
            else {
                btn.classList.remove('active');
            }
        });
        // Toggle views
        const tabViews = {
            chat: document.getElementById('tabChat'),
            history: document.getElementById('tabHistory'),
            settings: document.getElementById('tabSettings'),
        };
        Object.keys(tabViews).forEach((key) => {
            const el = tabViews[key];
            if (el) {
                if (key === tab) {
                    el.classList.add('active');
                }
                else {
                    el.classList.remove('active');
                }
            }
        });
        // Update Header title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                chat: 'Chat',
                history: 'Àkọsílẹ̀ (History)',
                settings: 'Ètò Ẹ̀rọ (Settings)',
            };
            pageTitle.textContent = titles[tab] || 'Chat';
        }
        if (tab === 'history') {
            this.renderHistory();
        }
        // Close mobile drawer
        if (this.sidebar.classList.contains('open')) {
            this.sidebar.classList.remove('open');
        }
    }
    // ==========================================================================
    // 3. QUICK YORUBA ACCENT BUTTONS
    // ==========================================================================
    initDiacritics() {
        const accentBtns = document.querySelectorAll('.accent-btn');
        accentBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const char = btn.getAttribute('data-char') || '';
                const start = this.userInput.selectionStart || this.userInput.value.length;
                const end = this.userInput.selectionEnd || this.userInput.value.length;
                const text = this.userInput.value;
                this.userInput.value = text.substring(0, start) + char + text.substring(end);
                this.userInput.focus();
                this.userInput.selectionStart = this.userInput.selectionEnd = start + char.length;
            });
        });
    }
    // ==========================================================================
    // 4. VOICE INTEGRATION INSIDE CHAT (Web Speech API)
    // ==========================================================================
    initVoice() {
        const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechAPI) {
            this.recognition = new SpeechAPI();
            this.recognition.lang = 'yo-NG';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.onstart = () => {
                this.isVoiceActive = true;
                this.micBtn.classList.add('recording');
                this.userInput.placeholder = 'ÀRÒYÉ ń tẹ́tí sí ọ... (Listening in Yoruba...)';
            };
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.value = transcript;
                this.userInput.focus();
            };
            this.recognition.onend = () => {
                this.isVoiceActive = false;
                this.micBtn.classList.remove('recording');
                this.userInput.placeholder = 'Bẹ̀rẹ̀ sí í kọ tàbí sọ̀rọ̀...';
            };
            this.recognition.onerror = () => {
                this.isVoiceActive = false;
                this.micBtn.classList.remove('recording');
                this.userInput.placeholder = 'Bẹ̀rẹ̀ sí í kọ tàbí sọ̀rọ̀...';
            };
        }
        if (this.micBtn) {
            this.micBtn.addEventListener('click', () => {
                if (!this.recognition) {
                    alert('Voice recognition is supported in Chrome/Edge browsers. Please ensure microphone permissions are granted.');
                    return;
                }
                if (this.isVoiceActive) {
                    this.recognition.stop();
                }
                else {
                    try {
                        this.recognition.start();
                    }
                    catch {
                        this.recognition.stop();
                    }
                }
            });
        }
    }
    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'yo-NG';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
    }
    // ==========================================================================
    // 5. CHAT FORM & BACKEND API INTERACTION
    // ==========================================================================
    initChat() {
        if (!this.chatForm)
            return;
        this.chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prompt = this.userInput.value.trim();
            if (!prompt)
                return;
            if (this.messages.length === 0 && this.heroWelcome) {
                this.heroWelcome.style.display = 'none';
            }
            // Add user message
            const userMsg = {
                id: 'msg-' + Date.now(),
                sender: 'user',
                text: prompt,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            this.messages.push(userMsg);
            this.appendMessage(userMsg);
            this.userInput.value = '';
            this.scrollToBottom();
            // Show typing indicator
            const typingId = this.showTyping();
            this.scrollToBottom();
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                });
                this.removeTyping(typingId);
                if (!res.ok)
                    throw new Error('API Error');
                const data = await res.json();
                const aiMsg = {
                    id: 'ai-' + Date.now(),
                    sender: 'ai',
                    text: data.response,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                this.messages.push(aiMsg);
                this.appendMessage(aiMsg);
                // Save to History
                this.saveHistory(prompt, data.response);
            }
            catch (err) {
                this.removeTyping(typingId);
                const errMsg = {
                    id: 'err-' + Date.now(),
                    sender: 'ai',
                    text: 'Ẹ dákun, àṣìṣe kan wáyé nígbà tí ẹ̀rọ ń gbìyànjú láti dáhùn. Ẹ gbìyànjú lẹ́ẹ̀kan sí i.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                this.appendMessage(errMsg);
            }
            this.scrollToBottom();
        });
    }
    appendMessage(msg) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${msg.sender}`;
        if (msg.sender === 'ai') {
            const avatar = document.createElement('div');
            avatar.className = 'bubble-avatar';
            avatar.innerHTML = `<img src="logo.png" alt="ÀRÒYÉ">`;
            bubble.appendChild(avatar);
        }
        const content = document.createElement('div');
        content.className = 'bubble-content';
        const p = document.createElement('p');
        p.textContent = msg.text;
        content.appendChild(p);
        // Audio Speaker Action Button for AI responses
        if (msg.sender === 'ai') {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'bubble-speak-btn';
            speakBtn.title = 'Gbọ́ ohùn (Listen to spoken Yoruba)';
            speakBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
        <span>Gbọ́</span>
      `;
            speakBtn.addEventListener('click', () => {
                this.speak(msg.text);
            });
            content.appendChild(speakBtn);
        }
        bubble.appendChild(content);
        this.messagesContainer.appendChild(bubble);
    }
    showTyping() {
        const id = 'typing-' + Date.now();
        const bubble = document.createElement('div');
        bubble.id = id;
        bubble.className = 'message-bubble ai';
        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar';
        avatar.innerHTML = `<img src="logo.png" alt="ÀRÒYÉ">`;
        bubble.appendChild(avatar);
        const content = document.createElement('div');
        content.className = 'bubble-content typing-indicator';
        content.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
        bubble.appendChild(content);
        this.messagesContainer.appendChild(bubble);
        return id;
    }
    removeTyping(id) {
        const el = document.getElementById(id);
        if (el)
            el.remove();
    }
    scrollToBottom() {
        this.chatViewport.scrollTop = this.chatViewport.scrollHeight;
    }
    // ==========================================================================
    // 6. TOP HEADER: SEARCH & THREE-DOTS MENU
    // ==========================================================================
    initHeaderMenu() {
        if (this.moreMenuBtn && this.moreDropdown) {
            this.moreMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moreDropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => {
                this.moreDropdown.classList.remove('open');
            });
        }
        // Dropdown item action clicks
        document.querySelectorAll('.menu-action-item').forEach((item) => {
            item.addEventListener('click', () => {
                const action = item.getAttribute('data-action');
                this.handleMenuAction(action);
                this.moreDropdown.classList.remove('open');
            });
        });
        // Chat search filtering
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                const query = this.searchInput.value.toLowerCase().trim();
                this.filterChatHistory(query);
            });
        }
    }
    handleMenuAction(action) {
        switch (action) {
            case 'files':
                alert('Àwọn Fáìlì (Files): Kò tí ì sí fáìlì kankan.');
                break;
            case 'pin':
                alert('Ìfọ̀rọ̀wérọ̀ yìí ti wà ní pínnì (Pinned chat).');
                break;
            case 'archive':
                alert('Ìfọ̀rọ̀wérọ̀ ti lọ sí àkójọpọ̀ (Archived).');
                break;
            case 'move':
                alert('Gbe lọ sí iṣẹ́-àkànṣe (Move to project).');
                break;
            case 'delete':
                if (confirm('Ṣé o fẹ́ pa ìfọ̀rọ̀wérọ̀ yìí rẹ́?')) {
                    this.messages = [];
                    this.messagesContainer.innerHTML = '';
                    if (this.heroWelcome)
                        this.heroWelcome.style.display = 'flex';
                }
                break;
        }
    }
    filterChatHistory(query) {
        if (!query) {
            this.renderHistory();
            return;
        }
        const filtered = this.history.filter((h) => h.title.toLowerCase().includes(query) || h.preview.toLowerCase().includes(query));
        this.renderHistory(filtered);
    }
    // ==========================================================================
    // 7. HISTORY STORAGE & RENDERING
    // ==========================================================================
    saveHistory(prompt, reply) {
        const record = {
            id: Date.now(),
            title: prompt.length > 32 ? prompt.substring(0, 32) + '...' : prompt,
            preview: `${prompt} — ${reply}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [...this.messages],
        };
        this.history.unshift(record);
        if (this.history.length > 25)
            this.history.pop();
        localStorage.setItem('aroye_history', JSON.stringify(this.history));
    }
    renderHistory(records = this.history) {
        if (!this.historyList)
            return;
        if (records.length === 0) {
            this.historyList.innerHTML = `
        <div class="empty-history-box">
          <p>Kò tí ì sí àkọsílẹ̀ kankan síbẹ̀.</p>
        </div>
      `;
            return;
        }
        this.historyList.innerHTML = records
            .map((item) => `
        <div class="history-card" data-id="${item.id}">
          <div class="history-card-header">
            <span class="history-card-title">${this.escapeHtml(item.title)}</span>
            <span class="history-card-date">${this.escapeHtml(item.timestamp)}</span>
          </div>
          <p class="history-card-preview">${this.escapeHtml(item.preview)}</p>
        </div>
      `)
            .join('');
        // Clicking a history card restores the chat
        this.historyList.querySelectorAll('.history-card').forEach((card) => {
            card.addEventListener('click', () => {
                const id = Number(card.getAttribute('data-id'));
                const record = this.history.find((h) => h.id === id);
                if (record && record.messages && record.messages.length > 0) {
                    this.messages = [...record.messages];
                    this.messagesContainer.innerHTML = '';
                    if (this.heroWelcome)
                        this.heroWelcome.style.display = 'none';
                    this.messages.forEach((m) => this.appendMessage(m));
                    this.switchTab('chat');
                }
            });
        });
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new AroyeApp();
});
export {};
