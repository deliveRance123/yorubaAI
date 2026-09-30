/**
 * ÀRÒYÉ — Client Frontend Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const heroWelcome = document.getElementById("heroWelcome");
  const messagesContainer = document.getElementById("messagesContainer");
  const chatViewport = document.getElementById("chatViewport");
  const micBtn = document.getElementById("micBtn");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const accentBtns = document.querySelectorAll(".accent-btn");
  const navItems = document.querySelectorAll(".nav-item, .dock-item");

  let isFirstMessage = true;

  // 1. Quick Yoruba Diacritic Bar
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

  // 2. Mobile Sidebar Toggle
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  // 3. Navigation Tab Switching
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(`[data-tab]`).forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(`[data-tab="${tab}"]`).forEach((b) => b.classList.add("active"));
    });
  });

  // 4. Voice Input (Web Speech API with Yoruba fallback)
  let recognition = null;
  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "yo-NG"; // Yoruba (Nigeria)

    recognition.onstart = () => {
      micBtn.classList.add("recording");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      userInput.focus();
    };

    recognition.onend = () => {
      micBtn.classList.remove("recording");
    };

    recognition.onerror = () => {
      micBtn.classList.remove("recording");
    };
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) {
      alert("Voice recognition is supported in Chrome/Edge browsers. Please ensure your microphone is enabled.");
      return;
    }
    if (micBtn.classList.contains("recording")) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    }
  });

  // 5. Send Message Handler
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt) return;

    if (isFirstMessage) {
      if (heroWelcome) heroWelcome.style.display = "none";
      isFirstMessage = false;
    }

    // Append User Message
    appendMessage(prompt, "user");
    userInput.value = "";
    scrollToBottom();

    // Show Typing Indicator
    const typingId = showTyping();
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      removeTyping(typingId);

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      appendMessage(data.response, "ai");
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
      avatar.innerHTML = `<img src="logo.svg" alt="ÀRÒYÉ">`;
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
    avatar.innerHTML = `<img src="logo.svg" alt="ÀRÒYÉ">`;
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
});
