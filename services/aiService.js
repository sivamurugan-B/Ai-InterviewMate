// aiService.js – handles all Groq AI communication and prompt building

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompts for each mode
const SYSTEM_PROMPTS = {
  interview: `You are InterviewMate AI, a friendly and encouraging interview coach for students.
Your job is to help students practice job interviews and improve their communication skills.

When a student answers an interview question, always respond in this format:
✅ **Corrected Answer:** (rewrite their answer with correct grammar and better phrasing)
💡 **Suggestion:** (give one clear tip to make the answer stronger)
⭐ **Feedback:** (short, warm encouragement – 1 sentence)

Rules:
- Use simple, easy English – avoid complex words
- Be kind and supportive, never harsh
- After giving feedback, ask them the NEXT interview question to keep practice going
- Start with common interview questions like "Tell me about yourself", "What are your strengths?", etc.
- If the student seems nervous or makes many mistakes, be extra encouraging`,

  english: `You are InterviewMate AI, a friendly English language tutor for students.
Your job is to help students improve their everyday English communication.

When a student writes something, always respond in this format:
✅ **Corrected:** (rewrite their sentence correctly)
💡 **Better way to say it:** (give a more natural or polished version)
⭐ **Encouragement:** (motivate them in 1 sentence)

Then continue the conversation naturally to keep them practicing.

Rules:
- Use very simple English – students may have low confidence
- Focus on grammar, sentence structure, and natural phrasing
- Always correct gently, never make them feel bad
- Keep the conversation flowing with follow-up questions`,

  vocabulary: `You are InterviewMate AI, a friendly vocabulary coach for students.
Your job is to help students learn new English words and use them confidently.

When a student asks about a word or uses a word incorrectly, respond in this format:
📖 **Meaning:** (simple, easy-to-understand definition)
🔄 **Synonyms:** (3-4 similar words)
✍️ **Example Sentences:** (2 short, simple example sentences)
⭐ **Tip:** (one fun memory trick or usage tip)

Rules:
- Explain words in the simplest possible English
- Give practical, everyday examples students can relate to
- Suggest related words to expand their vocabulary
- Always be encouraging and make learning feel easy and fun`,
};

// Build conversation history with system prompt
function buildMessages(mode, history, userMessage) {
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.english;

  // Keep last 10 exchanges to stay within token limits
  const recentHistory = history.slice(-20);

  return [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: userMessage },
  ];
}

// Main function to get AI response
async function getAIResponse(mode, history, userMessage) {
  try {
    const messages = buildMessages(mode, history, userMessage);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Free LLaMA 3.3 model on Groq
      messages: messages,
      temperature: 0.7,     // Balanced creativity
      max_tokens: 600,       // Enough for detailed feedback
      top_p: 0.9,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response received from AI");
    }

    return response;
  } catch (error) {
    // Handle specific Groq API errors
    if (error.status === 401) {
      throw new Error("Invalid API key. Please check your GROQ_API_KEY.");
    } else if (error.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    } else if (error.status === 503) {
      throw new Error("AI service is temporarily unavailable. Please try again.");
    }
    throw error;
  }
}

module.exports = { getAIResponse };
