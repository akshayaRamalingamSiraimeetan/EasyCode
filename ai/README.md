# EasyCode — AI Service

Standalone AI microservice for the EasyCode online judge platform.  
Powered by **Google Gemini**. Completely isolated from the main Express backend.

---

## Architecture

```
React Client
     │
     │  POST /api/ai/hint   (Bearer token)
     ▼
Express Server  (port 5000)
     │  — authenticates user
     │  — fetches problem from MongoDB
     │  — constructs payload
     │
     │  POST /hint
     ▼
AI Service  (port 6000)
     │  — validates payload
     │  — builds prompt
     │
     ▼
Google Gemini API
```

The **client never knows** the AI service exists.  
The **AI service never touches MongoDB**.

---

## Folder Structure

```
ai/
├── src/
│   ├── routes/
│   │   └── hintRoutes.js          # POST /hint
│   ├── controllers/
│   │   └── hintController.js      # Orchestrates prompt + Gemini call
│   ├── services/
│   │   └── geminiService.js       # Only file that imports Gemini SDK
│   ├── middleware/
│   │   ├── validateHintRequest.js # Input validation
│   │   └── errorMiddleware.js     # 404 + global error handler
│   ├── prompts/
│   │   ├── hintPrompt.js          # ✅ Implemented
│   │   ├── reviewPrompt.js        # 🔲 Placeholder
│   │   └── debugPrompt.js         # 🔲 Placeholder
│   ├── utils/
│   │   └── formatResponse.js      # Consistent response helpers
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── .env                           # PORT, GEMINI_API_KEY, MODEL
├── .gitignore
├── package.json
└── README.md
```

---

## Setup

```bash
cd ai
npm install
```

Copy `.env` and fill in your key:

```
PORT=6000
GEMINI_API_KEY=your_key_here
MODEL=gemini-2.5-flash
```

Start the service:

```bash
npm run dev   # development (nodemon)
npm start     # production
```

---

## API

### `POST /hint`

**Request body** (sent by the main server, not the client):

```json
{
  "problem": {
    "title": "Two Sum",
    "description": "Given an array of integers...",
    "difficulty": "Easy",
    "constraints": "1 <= nums.length <= 10^4"
  },
  "language": "cpp",
  "userCode": "#include <bits/stdc++.h>\n...",
  "hintLevel": 1
}
```

**Response:**

```json
{
  "success": true,
  "hint": "Think about what data structure lets you look up a value in constant time..."
}
```

`hintLevel` controls how much is revealed:
| Level | Behaviour |
|-------|-----------|
| 1 | High-level nudge — no code, no technique names |
| 2 | Points to the right data structure / algorithm |
| 3 | Key insight + optional short pseudocode snippet |

---

## Future Endpoints (architecture ready)

| Endpoint | Purpose |
|----------|---------|
| `POST /review` | Code review: correctness, style, efficiency |
| `POST /debug` | Explain why code fails a test case |
| `POST /explain` | Line-by-line explanation of the user's code |
| `POST /editorial` | Full editorial walk-through |
| `POST /complexity` | Time & space complexity analysis |
| `POST /chat` | Free-form Q&A about the problem |

To add any of these:
1. Create `src/prompts/<name>Prompt.js`
2. Create `src/controllers/<name>Controller.js`
3. Create `src/routes/<name>Routes.js`
4. Uncomment the route in `src/app.js`
5. Uncomment the proxy route in the main server's `aiRoutes.js`

---

## Health Check

```
GET http://localhost:6000/
→ { "success": true, "message": "EasyCode AI Service is running..." }
```
