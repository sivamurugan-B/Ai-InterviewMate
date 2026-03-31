// app.js – InterviewMate AI Frontend Logic

// ============================================
// STATE
// ============================================
const state = {
  currentMode: "interview",
  sessionId: generateSessionId(),
  isLoading: false,
  messageCount: 0,
};

// Mode configuration
const MODES = {
  interview: {
    label: "💼 Interview Mode",
    cardTitle: "💼 Interview Mode",
    cardText: "Practice answering interview questions. I'll give you feedback on grammar, clarity, and confidence!",
    placeholder: "Type your answer to an interview question...",
    startMessage: "Hello! 👋 I'm your Interview Coach. Let's start with a classic question:\n\n**Tell me about yourself.**\n\nTake your time and answer in your own words – don't worry about mistakes!",
  },
  english: {
    label: "💬 English Practice",
    cardTitle: "💬 English Practice Mode",
    cardText: "Chat casually in English. I'll gently correct your grammar and suggest better ways to express yourself.",
    placeholder: "Write anything in English – I'll help you improve!",
    startMessage: "Hi there! 😊 I'm your English Practice buddy. You can write anything to me – about your day, your hobbies, or anything you want!\n\nDon't worry about making mistakes. That's how we learn. Let's talk! 🗣️",
  },
  vocabulary: {
    label: "📖 Vocabulary Builder",
    cardTitle: "📖 Vocabulary Mode",
    cardText: "Ask about any word – I'll give you the meaning, synonyms, and example sentences.",
    placeholder: "Type a word you want to learn (e.g., 'ambitious')...",
    startMessage: "Hello, word explorer! 📚 I'm here to help you build your vocabulary!\n\nYou can:\n- Ask about any English word (e.g., \"What does *resilient* mean?\")\n- Ask for synonyms (e.g., \"synonyms for happy\")\n- Ask to use a word in a sentence\n\nWhich word shall we learn first? 🌟",
  },
};

// Rotating tips
const TIPS = [
  "💡 Don't worry about mistakes – that's how you learn!",
  "💡 Practice for 10 minutes every day for great results.",
  "💡 Speaking slowly and clearly is better than speaking fast.",
  "💡 Reading English books and articles helps a lot!",
  "💡 It's okay to ask 'What does that word mean?'",
  "💡 Confidence grows with every conversation you have.",
  "💡 Try to think in English, not translate in your head.",
];

// ============================================
// DOM REFERENCES
// ============================================
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const charCount = document.getElementById("charCount");
const clearBtn = document.getElementById("clearBtn");
const headerModeBadge = document.getElementById("headerModeBadge");
const modeCardTitle = document.getElementById("modeCardTitle");
const modeCardText = document.getElementById("modeCardText");
const tipText = document.getElementById("tipText");
const welcomeScreen = document.getElementById("welcomeScreen");

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  rotateTips();
});

function setupEventListeners() {
  // Mode buttons
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
    });
  });

  // Input events
  userInput.addEventListener("keydown", handleKeyDown);
  userInput.addEventListener("input", handleInputChange);

  // Clear button
  clearBtn.addEventListener("click", clearConversation);
}

// ============================================
// MODE SWITCHING
// ============================================
function switchMode(mode) {
  if (!MODES[mode]) return;

  state.currentMode = mode;

  // Update sidebar buttons
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // Update header badge
  headerModeBadge.textContent = MODES[mode].label;

  // Update mode card
  modeCardTitle.textContent = MODES[mode].cardTitle;
  modeCardText.textContent = MODES[mode].cardText;

  // Update input placeholder
  userInput.placeholder = MODES[mode].placeholder;

  // Clear chat and show mode intro
  clearChatUI();
  addBotMessage(MODES[mode].startMessage);
}

// Called from welcome screen cards
function selectModeAndStart(mode) {
  switchMode(mode);
}

// ============================================
// SENDING MESSAGES
// ============================================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || state.isLoading) return;

  // Remove welcome screen if still visible
  if (welcomeScreen) {
    welcomeScreen.style.display = "none";
  }

  // Add user message to UI
  addUserMessage(text);

  // Clear input
  userInput.value = "";
  charCount.textContent = "0";
  autoResizeTextarea();

  // Show typing indicator
  showTyping(true);
  setLoading(true);

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: state.currentMode,
        sessionId: state.sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    showTyping(false);
    addBotMessage(data.reply);
  } catch (error) {
    showTyping(false);
    addErrorMessage(error.message || "Connection failed. Please try again.");
  } finally {
    setLoading(false);
  }
}

// ============================================
// MESSAGE RENDERING
// ============================================
function addUserMessage(text) {
  const messageEl = createMessage("user", text);
  chatMessages.appendChild(messageEl);
  scrollToBottom();
  state.messageCount++;
}

function addBotMessage(text) {
  const messageEl = createMessage("bot", text);
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

function addErrorMessage(text) {
  const messageEl = createMessage("bot", `⚠️ ${text}`, true);
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

function createMessage(type, text, isError = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${type}${isError ? " error-message" : ""}`;

  // Avatar
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = type === "user" ? "You" : "🤖";

  // Content wrapper
  const content = document.createElement("div");
  content.className = "message-content";

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // Render markdown-like formatting for bot messages
  if (type === "bot") {
    bubble.innerHTML = formatBotText(text);
  } else {
    bubble.textContent = text;
  }

  // Timestamp
  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = getTime();

  content.appendChild(bubble);
  content.appendChild(time);

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);

  return wrapper;
}

// Format bot text: convert markdown-like syntax to HTML
function formatBotText(text) {
  return text
    // Bold: **text** → <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text* → <em>text</em>
    .replace(/\*(?!\*)(.+?)(?<!\*)\*/g, "<em>$1</em>")
    // Newlines → <br>
    .replace(/\n/g, "<br>")
    // Prevent XSS: this is safe since we control the source (AI response)
    // But clean any raw script tags just in case
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

// ============================================
// UI HELPERS
// ============================================
function showTyping(show) {
  typingIndicator.style.display = show ? "flex" : "none";
  if (show) scrollToBottom();
}

function setLoading(loading) {
  state.isLoading = loading;
  sendBtn.disabled = loading;
  userInput.disabled = loading;
}

function scrollToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

function clearChatUI() {
  // Remove all messages but keep welcome screen structure
  const messages = chatMessages.querySelectorAll(".message");
  messages.forEach((m) => m.remove());

  // Re-hide welcome screen (mode start message will be shown instead)
  if (welcomeScreen) welcomeScreen.style.display = "none";
}

async function clearConversation() {
  // Reset session on backend
  try {
    await fetch("/chat/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
  } catch (_) {
    // Ignore errors on reset
  }

  // Generate new session ID
  state.sessionId = generateSessionId();

  // Clear UI and show mode intro
  clearChatUI();
  addBotMessage(MODES[state.currentMode].startMessage);
  showToast("Conversation cleared! Fresh start 🎉");
}

// ============================================
// INPUT HANDLING
// ============================================
function handleKeyDown(e) {
  // Enter = send, Shift+Enter = newline
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function handleInputChange() {
  const len = userInput.value.length;
  charCount.textContent = len;

  // Warn when approaching limit
  charCount.style.color = len > 450 ? "var(--danger)" : "var(--text-muted)";

  autoResizeTextarea();
}

function autoResizeTextarea() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ============================================
// TIPS ROTATION
// ============================================
function rotateTips() {
  let i = 0;
  setInterval(() => {
    i = (i + 1) % TIPS.length;
    tipText.style.opacity = "0";
    setTimeout(() => {
      tipText.textContent = TIPS[i];
      tipText.style.opacity = "1";
    }, 300);
  }, 8000);

  // Smooth fade transition
  tipText.style.transition = "opacity 0.3s ease";
}

// ============================================
// UTILITIES
// ============================================
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateSessionId() {
  return "sess_" + Math.random().toString(36).substring(2, 11);
}
