// routes/chat.js – Express route for chat API

const express = require("express");
const router = express.Router();
const { getAIResponse } = require("../services/aiService");

// In-memory session store (resets on server restart)
// For production, use Redis or a database
const sessions = new Map();

// POST /chat – main chat endpoint
router.post("/", async (req, res) => {
  try {
    const { message, mode, sessionId } = req.body;

    // Validate required fields
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // Validate mode (default to english if not provided)
    const validModes = ["interview", "english", "vocabulary"];
    const activeMode = validModes.includes(mode) ? mode : "english";

    // Get or create conversation history for this session
    const sid = sessionId || "default";
    if (!sessions.has(sid)) {
      sessions.set(sid, []);
    }
    const history = sessions.get(sid);

    // Get AI response
    const aiResponse = await getAIResponse(activeMode, history, message.trim());

    // Update conversation history
    history.push({ role: "user", content: message.trim() });
    history.push({ role: "assistant", content: aiResponse });

    // Keep history to last 20 messages (10 exchanges) to manage memory
    if (history.length > 20) {
      history.splice(0, 2);
    }

    res.json({
      reply: aiResponse,
      mode: activeMode,
      sessionId: sid,
    });
  } catch (error) {
    console.error("Chat route error:", error.message);
    res.status(500).json({
      error: error.message || "Something went wrong. Please try again.",
    });
  }
});

// POST /chat/reset – clear conversation history for a session
router.post("/reset", (req, res) => {
  const { sessionId } = req.body;
  const sid = sessionId || "default";
  sessions.delete(sid);
  res.json({ message: "Conversation cleared successfully." });
});

module.exports = router;
