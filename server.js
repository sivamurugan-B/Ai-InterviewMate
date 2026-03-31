// server.js – InterviewMate AI main server

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/chat", chatRoutes);

// Health check endpoint (useful for Render deployment)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "InterviewMate AI is running!" });
});

// Fallback: serve index.html for any unknown routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 InterviewMate AI is running!`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   Mode:   ${process.env.NODE_ENV || "development"}\n`);

  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️  WARNING: GROQ_API_KEY is not set in .env file!");
    console.warn("   Get your free key at: https://console.groq.com\n");
  }
});
