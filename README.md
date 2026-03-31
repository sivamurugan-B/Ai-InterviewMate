# Ai-InterviewMate
d:/interview chatbot/
├── server.js              ← Express server, serves frontend + API
├── package.json
├── .env.example           ← Copy to .env and add your key
├── .gitignore
├── routes/
│   └── chat.js            ← POST /chat + POST /chat/reset
├── services/
│   └── aiService.js       ← Groq LLaMA3 integration + 3 system prompts
└── public/
    ├── index.html         ← Full chat UI layout
    ├── style.css          ← Modern dark sidebar + clean chat design
    └── app.js             ← Mode switching, message rendering, API calls
