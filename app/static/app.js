/**
 * ÀRÒYÉ — Client Frontend Logic
 * Supports: Chat, Voice Studio, History, Settings, and Desktop Sidebar Collapse
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const heroWelcome = document.getElementById("heroWelcome");
  const messagesContainer = document.getElementById("messagesContainer");
  const chatViewport = document.getElementById("chatViewport");
  const micBtn = document.getElementById("micBtn");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const collapseSidebarBtn = document.getElementById("collapseSidebarBtn");
  const expandSidebarBtn = document.getElementById("expandSidebarBtn");
  const accentBtns = document.querySelectorAll(".accent-btn");
  const pageTitle = document.getElementById("pageTitle");

  // Tabs
  const tabViews = {
    chat: document.getElementById("tabChat"),
    voice: document.getElementById("tabVoice"),
    history: document.getElementById("tabHistory"),
    settings: document.getElementById("tabSettings"),
  };

  // Voice Studio Elements
  const voiceToggleActionBtn = document.getElementById("voiceToggleActionBtn");
  const voiceBtnLabel = document.getElementById("voiceBtnLabel");
  const voiceAvatarPulse = document.querySelector(".voice-avatar-pulse");
  const voiceStatusHeading = document.getElementById("voiceStatusHeading");
  const voiceStatusSub = document.getElementById("voiceStatusSub");
  const voiceLiveTranscript = document.getElementById("voiceLiveTranscript");
  const voiceResponseCard = document.getElementById("voiceResponseCard");
  const voiceReplyText = document.getElementById("voiceReplyText");
  const replayVoiceBtn = document.getElementById("replayVoiceBtn");

  // History Elements
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  let isFirstMessage = true;
  let chatHistory = JSON.parse(localStorage.getItem("aroye_history") || "[]");

  // ==========================================================================
  // 1. DESKTOP SIDEBAR COLLAPSE / EXPAND
  // ==========================================================================
  if (collapseSidebarBtn) {
    collapseSidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("collapsed");
    });
  }

  if (expandSidebarBtn) {
    expandSidebarBtn.addEventListener("click", () => {
      sidebar.classList.remove("collapsed");
    });
  }

  // Mobile drawer toggle
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  // ==========================================================================
  // 2. TAB SWITCHING (Chat, Voice, History, Settings)
  // ==========================================================================
  const tabTitles = {
    chat: "Chat",
    voice: "Voice Studio",
    history: "Àkọsílẹ̀ (History)",
    settings: "Ètò Ẹ̀rọ (Settings)",
  };

  function switchTab(tabName) {
    // Update navigation active states
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update Tab View visibility
    Object.keys(tabViews).forEach((key) => {
      if (tabViews[key]) {
        if (key === tabName) {
          tabViews[key].classList.add("active");
        } else {
          tabViews[key].classList.remove("active");
        }
      }
    });

    if (pageTitle) {
      pageTitle.textContent = tabTitles[tabName] || "Chat";
    }

    if (tabName === "history") {
      renderHistory();
    }

    // Close mobile drawer on navigation
    if (sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
  }

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      switchTab(tab);
    });
  });

  // ==========================================================================
  // 3. QUICK YORUBA DIACRITIC TOOLBAR
  // ==========================================================================
  accentBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const char = btn.getAttribute("data-char");
      const start = userInput.selectionStart || userInput.value.length;
      const end = userInput.selectionEnd || userInput.value.length;
      const text = userInput.value;
      userInput.value = text.substring(0, start) + char + text.substring(end);
      userInput.focus();
      userInput.selectionStart = userInput.selectionEnd = start + char.length;
    });
  });

  // ==========================================================================
  // 4. SPEECH RECOGNITION (Input Capsule Mic)
  // ==========================================================================
  let inputRecognition = null;
  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    inputRecognition = new SpeechAPI();
    inputRecognition.lang = "yo-NG";

    inputRecognition.onstart = () => {
      micBtn.classList.add("recording");
    };

    inputRecognition.onresult = (e) => {
      userInput.value = e.results[0][0].transcript;
      userInput.focus();
    };

    inputRecognition.onend = () => micBtn.classList.remove("recording");
    inputRecognition.onerror = () => micBtn.classList.remove("recording");
  }

  micBtn.addEventListener("click", () => {
    if (!inputRecognition) {
      alert("Voice recognition requires Chrome or Edge with microphone permissions.");
      return;
    }
    if (micBtn.classList.contains("recording")) {
      inputRecognition.stop();
    } else {
      try {
        inputRecognition.start();
      } catch (err) {
        inputRecognition.stop();
      }
    }
  });

  // ==========================================================================
  // 5. DEDICATED VOICE STUDIO LOGIC
  // ==========================================================================
  let isVoiceActive = false;
  let voiceRecognition = null;

  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechAPI();
    voiceRecognition.lang = "yo-NG";

    voiceRecognition.onstart = () => {
      isVoiceActive = true;
      voiceAvatarPulse.classList.add("active");
      voiceToggleActionBtn.classList.add("active");
      voiceStatusHeading.textContent = "ÀRÒYÉ ń tẹ́tí sí ọ...";
      voiceStatusSub.textContent = "Sọ̀rọ̀ sínú gbohùngbohùn rẹ ní kedere.";
      voiceBtnLabel.textContent = "Dánu Dúró (Stop)";
    };

    voiceRecognition.onresult = async (e) => {
      const userSpoken = e.results[0][0].transcript;
      voiceLiveTranscript.textContent = userSpoken;
      voiceStatusHeading.textContent = "ÀRÒYÉ ń ronú lórí ọ̀rọ̀ rẹ...";
      voiceStatusSub.textContent = "Ẹ jọ̀wọ́, ẹ ní sùúrù díẹ̀...";

      // Send to backend
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userSpoken }),
        });
        const data = await res.json();
        
        voiceReplyText.textContent = data.response;
        voiceResponseCard.style.display = "block";
        voiceStatusHeading.textContent = "ÀRÒYÉ ti dáhùn!";
        voiceStatusSub.textContent = "Tẹ̀ bọ́tìnnì Gbọ́ láti tẹ́tí sí èsì rẹ̀.";

        // Speak aloud
        speakYorubaText(data.response);

        // Save to history
        saveToHistory(userSpoken, data.response);
      } catch (err) {
        voiceReplyText.textContent = "Àṣìṣe kan wáyé nígbà tí a ń dáhùn.";
        voiceResponseCard.style.display = "block";
      }
    };

    voiceRecognition.onend = () => {
      isVoiceActive = false;
      voiceAvatarPulse.classList.remove("active");
      voiceToggleActionBtn.classList.remove("active");
      voiceBtnLabel.textContent = "Bẹ̀rẹ̀ Ìsọ̀rọ̀ (Start Speaking)";
    };
  }

  voiceToggleActionBtn.addEventListener("click", () => {
    if (!voiceRecognition) {
      alert("Voice recognition requires Chrome or Edge with microphone permissions.");
      return;
    }
    if (isVoiceActive) {
      voiceRecognition.stop();
    } else {
      voiceRecognition.start();
    }
  });

  replayVoiceBtn.addEventListener("click", () => {
    if (voiceReplyText.textContent) {
      speakYorubaText(voiceReplyText.textContent);
    }
  });

  function speakYorubaText(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "yo-NG";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  // ==========================================================================
  // 6. CHAT FORM SUBMISSION
  // ==========================================================================
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt) return;

    if (isFirstMessage) {
      if (heroWelcome) heroWelcome.style.display = "none";
      isFirstMessage = false;
    }

    appendMessage(prompt, "user");
    userInput.value = "";
    scrollToBottom();

    const typingId = showTyping();
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      removeTyping(typingId);

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      appendMessage(data.response, "ai");

      // Save to conversation history
      saveToHistory(prompt, data.response);
    } catch (err) {
      removeTyping(typingId);
      appendMessage("Ẹ dákun, àṣìṣe kan wáyé nígbà tí ẹ̀rọ ń gbìyànjú láti dáhùn. Ẹ gbìyànjú lẹ́ẹ̀kan sí i.", "ai");
    }

    scrollToBottom();
  });

  function appendMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${sender}`;

    if (sender === "ai") {
      const avatar = document.createElement("div");
      avatar.className = "bubble-avatar";
      avatar.innerHTML = `<img src="logo.jpg" alt="ÀRÒYÉ">`;
      bubble.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "bubble-content";
    content.textContent = text;
    bubble.appendChild(content);

    messagesContainer.appendChild(bubble);
  }

  function showTyping() {
    const id = "typing-" + Date.now();
    const bubble = document.createElement("div");
    bubble.id = id;
    bubble.className = "message-bubble ai";

    const avatar = document.createElement("div");
    avatar.className = "bubble-avatar";
    avatar.innerHTML = `<img src="logo.jpg" alt="ÀRÒYÉ">`;
    bubble.appendChild(avatar);

    const content = document.createElement("div");
    content.className = "bubble-content typing-indicator";
    content.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    bubble.appendChild(content);

    messagesContainer.appendChild(bubble);
    return id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  // ==========================================================================
  // 7. HISTORY MANAGEMENT
  // ==========================================================================
  function saveToHistory(userText, aiText) {
    const record = {
      id: Date.now(),
      title: userText.length > 30 ? userText.substring(0, 30) + "..." : userText,
      preview: `${userText} — ${aiText}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatHistory.unshift(record);
    if (chatHistory.length > 20) chatHistory.pop();
    localStorage.setItem("aroye_history", JSON.stringify(chatHistory));
  }

  function renderHistory() {
    if (!historyList) return;
    if (chatHistory.length === 0) {
      historyList.innerHTML = `<p style="color: #9CA3AF; text-align: center; padding: 24px;">Kò tí ì sí àkọsílẹ̀ kankan síbẹ̀.</p>`;
      return;
    }

    historyList.innerHTML = chatHistory.map((item) => `
      <div class="history-card" data-id="${item.id}">
        <div class="history-card-header">
          <span class="history-card-title">${item.title}</span>
          <span class="history-card-date">${item.date}</span>
        </div>
        <p class="history-card-preview">${item.preview}</p>
      </div>
    `).join("");
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Ṣé o dá ẹ lójú pé o fẹ́ pa gbogbo àkọsílẹ̀ rẹ́?")) {
        chatHistory = [];
        localStorage.removeItem("aroye_history");
        renderHistory();
      }
    });
  }
});
