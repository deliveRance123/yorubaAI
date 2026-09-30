/**
 * ÀRÒYÉ — Sovereign Yoruba AI (TypeScript Frontend Architecture)
 * Unified Chat + Voice, ChatGPT-style Collapsing Sidebar, Three-Dots Menu, & History
 */

class AroyeApp {
  private activeTab: ActiveTab = 'chat';
  private messages: ChatMessage[] = [];
  private history: HistoryRecord[] = [];
  private isSidebarCollapsed: boolean = false;
  private isVoiceActive: boolean = false;
  private recognition: any = null;

  // DOM Elements
  private sidebar!: HTMLElement;
  private appLayout!: HTMLElement;
  private chatViewport!: HTMLElement;
  private heroWelcome!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private chatForm!: HTMLFormElement;
  private userInput!: HTMLInputElement;
  private micBtn!: HTMLButtonElement;
  private collapseBtn!: HTMLButtonElement;
  private expandSidebarBtn!: HTMLButtonElement;
  private brandLogoBtn!: HTMLElement;
  private searchToggleBtn!: HTMLButtonElement;
  private searchCloseBtn!: HTMLButtonElement;
  private headerSearchWrap!: HTMLElement;
  private searchInput!: HTMLInputElement;
  private moreMenuBtn!: HTMLButtonElement;
  private moreDropdown!: HTMLElement;
  private historyList!: HTMLElement;
  private clearHistoryBtn!: HTMLButtonElement;

  constructor() {
    this.initElements();
    this.loadState();
    this.initSidebar();
    this.initTabs();
    this.initVoice();
    this.initChat();
    this.initHeaderMenu();
  }

  private initElements(): void {
    this.sidebar = document.getElementById('sidebar') as HTMLElement;
    this.appLayout = document.getElementById('appLayout') as HTMLElement;
    this.chatViewport = document.getElementById('chatViewport') as HTMLElement;
    this.heroWelcome = document.getElementById('heroWelcome') as HTMLElement;
    this.messagesContainer = document.getElementById('messagesContainer') as HTMLElement;
    this.chatForm = document.getElementById('chatForm') as HTMLFormElement;
    this.userInput = document.getElementById('userInput') as HTMLInputElement;
    this.micBtn = document.getElementById('micBtn') as HTMLButtonElement;
    this.collapseBtn = document.getElementById('collapseSidebarBtn') as HTMLButtonElement;
    this.expandSidebarBtn = document.getElementById('expandSidebarBtn') as HTMLButtonElement;
    this.brandLogoBtn = document.getElementById('brandLogo') as HTMLElement;
    this.searchToggleBtn = document.getElementById('searchToggleBtn') as HTMLButtonElement;
    this.searchCloseBtn = document.getElementById('searchCloseBtn') as HTMLButtonElement;
    this.headerSearchWrap = document.getElementById('headerSearchWrap') as HTMLElement;
    this.searchInput = document.getElementById('chatSearchInput') as HTMLInputElement;
    this.moreMenuBtn = document.getElementById('moreMenuBtn') as HTMLButtonElement;
    this.moreDropdown = document.getElementById('moreDropdown') as HTMLElement;
    this.historyList = document.getElementById('historyList') as HTMLElement;
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn') as HTMLButtonElement;
  }

  private loadState(): void {
    // Load sidebar preference
    const savedCollapse = localStorage.getItem('aroye_sidebar_collapsed');
    if (savedCollapse === 'true') {
      this.isSidebarCollapsed = true;
      if (this.sidebar) this.sidebar.classList.add('collapsed');
      if (this.appLayout) this.appLayout.classList.add('sidebar-collapsed');
    }

    // Load conversation history
    const savedHistory = localStorage.getItem('aroye_history');
    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
      } catch {
        this.history = [];
      }
    }
  }

  // ==========================================================================
  // 1. SIDEBAR COLLAPSE / EXPAND (ChatGPT Mini Rail Style)
  // ==========================================================================
  private initSidebar(): void {
    if (this.collapseBtn) {
      this.collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (this.expandSidebarBtn) {
      this.expandSidebarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (this.brandLogoBtn) {
      this.brandLogoBtn.addEventListener('click', () => {
        if (this.isSidebarCollapsed) {
          this.toggleSidebar();
        }
      });
    }

    // Mobile drawer toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle && this.sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sidebar.classList.toggle('open');
      });

      document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (this.sidebar.classList.contains('open') && !this.sidebar.contains(target) && !menuToggle.contains(target)) {
          this.sidebar.classList.remove('open');
        }
      });
    }
  }

  private toggleSidebar(): void {
    if (!this.sidebar || !this.appLayout) return;
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.sidebar.classList.add('collapsed');
      this.appLayout.classList.add('sidebar-collapsed');
      if (this.collapseBtn) this.collapseBtn.setAttribute('title', 'Expand sidebar');
    } else {
      this.sidebar.classList.remove('collapsed');
      this.appLayout.classList.remove('sidebar-collapsed');
      if (this.collapseBtn) this.collapseBtn.setAttribute('title', 'Collapse sidebar');
    }
    localStorage.setItem('aroye_sidebar_collapsed', String(this.isSidebarCollapsed));
  }

  // ==========================================================================
  // 2. TAB SWITCHING (Chat, History, Settings) - Desktop & Mobile
  // ==========================================================================
  private initTabs(): void {
    const navButtons = document.querySelectorAll<HTMLElement>('[data-tab]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as ActiveTab;
        if (tab) this.switchTab(tab);
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

  private switchTab(tab: ActiveTab): void {
    this.activeTab = tab;

    // Update active class on all nav items (desktop + mobile dock)
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle views
    const tabViews: Record<ActiveTab, HTMLElement | null> = {
      chat: document.getElementById('tabChat'),
      history: document.getElementById('tabHistory'),
      settings: document.getElementById('tabSettings'),
    };

    Object.keys(tabViews).forEach((key) => {
      const el = tabViews[key as ActiveTab];
      if (el) {
        if (key === tab) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // Update Header title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      const titles: Record<ActiveTab, string> = {
        chat: 'Chat',
        history: 'Àkọsílẹ̀ (History)',
        settings: 'Ètò Ẹ̀rọ (Settings)',
      };
      pageTitle.textContent = titles[tab] || 'Chat';
    }

    if (tab === 'history') {
      this.renderHistory();
    }

    // Close mobile drawer if open
    if (this.sidebar && this.sidebar.classList.contains('open')) {
      this.sidebar.classList.remove('open');
    }
  }

  // ==========================================================================
  // 3. VOICE INTEGRATION INSIDE CHAT (Web Speech API)
  // ==========================================================================
  private initVoice(): void {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechAPI) {
      this.recognition = new SpeechAPI();
      this.recognition.lang = 'yo-NG';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isVoiceActive = true;
        if (this.micBtn) this.micBtn.classList.add('recording');
        if (this.userInput) this.userInput.placeholder = 'ÀRÒYÉ ń tẹ́tí sí ọ... (Listening in Yoruba...)';
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (this.userInput) {
          this.userInput.value = transcript;
          this.userInput.focus();
        }
      };

      this.recognition.onend = () => {
        this.isVoiceActive = false;
        if (this.micBtn) this.micBtn.classList.remove('recording');
        if (this.userInput) this.userInput.placeholder = 'Bẹ̀rẹ̀ sí í kọ tàbí sọ̀rọ̀...';
      };

      this.recognition.onerror = () => {
        this.isVoiceActive = false;
        if (this.micBtn) this.micBtn.classList.remove('recording');
        if (this.userInput) this.userInput.placeholder = 'Bẹ̀rẹ̀ sí í kọ tàbí sọ̀rọ̀...';
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
        } else {
          try {
            this.recognition.start();
          } catch {
            this.recognition.stop();
          }
        }
      });
    }
  }

  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'yo-NG';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  // ==========================================================================
  // 4. CHAT FORM & BACKEND API INTERACTION
  // ==========================================================================
  private initChat(): void {
    if (!this.chatForm || !this.userInput) return;

    this.chatForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const prompt = this.userInput.value.trim();
      if (!prompt) return;

      if (this.messages.length === 0 && this.heroWelcome) {
        this.heroWelcome.style.display = 'none';
      }

      // Add user message
      const userMsg: ChatMessage = {
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

        if (!res.ok) throw new Error('API Error');

        const data: ApiResponse = await res.json();
        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        this.messages.push(aiMsg);
        this.appendMessage(aiMsg);

        // Save to History
        this.saveHistory(prompt, data.response);
      } catch (err) {
        this.removeTyping(typingId);
        const errMsg: ChatMessage = {
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

  private appendMessage(msg: ChatMessage): void {
    if (!this.messagesContainer) return;
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

  private showTyping(): string {
    const id = 'typing-' + Date.now();
    if (!this.messagesContainer) return id;
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

  private removeTyping(id: string): void {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  private scrollToBottom(): void {
    if (this.chatViewport) {
      this.chatViewport.scrollTop = this.chatViewport.scrollHeight;
    }
  }

  // ==========================================================================
  // 5. TOP HEADER: SEARCH & THREE-DOTS MENU
  // ==========================================================================
  private initHeaderMenu(): void {
    // Search toggle button in header
    if (this.searchToggleBtn && this.headerSearchWrap) {
      this.searchToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openSearch();
      });
    }

    if (this.searchCloseBtn && this.headerSearchWrap) {
      this.searchCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeSearch();
      });
    }

    // More menu dropdown toggle
    if (this.moreMenuBtn && this.moreDropdown) {
      this.moreMenuBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.moreDropdown.classList.toggle('open');
      });

      document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (this.moreDropdown && !this.moreDropdown.contains(target) && target !== this.moreMenuBtn) {
          this.moreDropdown.classList.remove('open');
        }
      });
    }

    // Dropdown item action clicks
    document.querySelectorAll<HTMLButtonElement>('.menu-action-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        this.handleMenuAction(action);
        if (this.moreDropdown) this.moreDropdown.classList.remove('open');
      });
    });

    // Chat search input event
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        const query = this.searchInput.value.toLowerCase().trim();
        this.filterChatHistory(query);
      });
    }
  }

  private openSearch(): void {
    if (this.headerSearchWrap) {
      this.headerSearchWrap.classList.add('open');
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }
  }

  private closeSearch(): void {
    if (this.headerSearchWrap) {
      this.headerSearchWrap.classList.remove('open');
      if (this.searchInput) {
        this.searchInput.value = '';
        this.renderHistory();
      }
    }
  }

  private handleMenuAction(action: string | null): void {
    switch (action) {
      case 'search':
        this.openSearch();
        this.switchTab('history');
        break;
      case 'files':
        alert('Àwọn Fáìlì (Files): Kò tí ì sí fáìlì kankan tí a so mọ́ ìfọ̀rọ̀wérọ̀ yìí.');
        break;
      case 'pin':
        alert('Ìfọ̀rọ̀wérọ̀ yìí ti wà ní pínnì lókè (Chat Pinned Successfully).');
        break;
      case 'archive':
        alert('Ìfọ̀rọ̀wérọ̀ ti lọ sí àkójọpọ̀ (Chat Archived Successfully).');
        break;
      case 'move':
        alert('Gbe lọ sí iṣẹ́-àkànṣe (Move to project).');
        break;
      case 'delete':
        if (confirm('Ṣé o fẹ́ pa ìfọ̀rọ̀wérọ̀ yìí rẹ́?')) {
          this.messages = [];
          if (this.messagesContainer) this.messagesContainer.innerHTML = '';
          if (this.heroWelcome) this.heroWelcome.style.display = 'flex';
        }
        break;
    }
  }

  private filterChatHistory(query: string): void {
    this.switchTab('history');
    if (!query) {
      this.renderHistory();
      return;
    }
    const filtered = this.history.filter(
      (h) => h.title.toLowerCase().includes(query) || h.preview.toLowerCase().includes(query)
    );
    this.renderHistory(filtered);
  }

  // ==========================================================================
  // 6. HISTORY STORAGE & RENDERING
  // ==========================================================================
  private saveHistory(prompt: string, reply: string): void {
    const record: HistoryRecord = {
      id: Date.now(),
      title: prompt.length > 32 ? prompt.substring(0, 32) + '...' : prompt,
      preview: `${prompt} — ${reply}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [...this.messages],
    };

    this.history.unshift(record);
    if (this.history.length > 30) this.history.pop();
    localStorage.setItem('aroye_history', JSON.stringify(this.history));
  }

  private renderHistory(records: HistoryRecord[] = this.history): void {
    if (!this.historyList) return;

    if (records.length === 0) {
      this.historyList.innerHTML = `
        <div class="empty-history-box">
          <p>Kò tí ì sí àkọsílẹ̀ kankan síbẹ̀.</p>
          <button type="button" class="start-chat-btn" id="startNewChatBtn">Bẹ̀rẹ̀ Ìfọ̀rọ̀wérọ̀ Tuntun</button>
        </div>
      `;
      const newChatBtn = document.getElementById('startNewChatBtn');
      if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
          this.switchTab('chat');
        });
      }
      return;
    }

    this.historyList.innerHTML = records
      .map(
        (item) => `
        <div class="history-card" data-id="${item.id}">
          <div class="history-card-header">
            <span class="history-card-title">${this.escapeHtml(item.title)}</span>
            <span class="history-card-date">${this.escapeHtml(item.timestamp)}</span>
          </div>
          <p class="history-card-preview">${this.escapeHtml(item.preview)}</p>
        </div>
      `
      )
      .join('');

    // Clicking a history card restores the chat
    this.historyList.querySelectorAll<HTMLElement>('.history-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = Number(card.getAttribute('data-id'));
        const record = this.history.find((h) => h.id === id);
        if (record && record.messages && record.messages.length > 0) {
          this.messages = [...record.messages];
          if (this.messagesContainer) this.messagesContainer.innerHTML = '';
          if (this.heroWelcome) this.heroWelcome.style.display = 'none';
          this.messages.forEach((m) => this.appendMessage(m));
          this.switchTab('chat');
        }
      });
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Instantiate on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AroyeApp();
  });
} else {
  new AroyeApp();
}
