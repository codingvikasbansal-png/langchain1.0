# Simple Chat Bot UI with LangChain Backend

A simple chat bot interface built with Next.js, Assistant-ui, and LangChain backend.

## Features

- Clean, simple chat interface
- Built with assistant-ui React library for UI primitives
- LangChain backend with OpenAI GPT integration
- Non-streaming responses (complete responses displayed at once)
- Professional SDE-3 level code practices

## Project Structure

```
.
├── app/                    # Next.js frontend
│   ├── page.tsx           # Main chat interface
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── backend/               # LangChain Node.js backend
│   ├── server.js          # Express server with LangChain
│   ├── package.json       # Backend dependencies
│   └── .env               # Backend environment variables
└── package.json           # Frontend dependencies
```

## Getting Started

### 1. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env` file:
```
OPENAI_API_KEY=sk-your-api-key-here
PORT=4000
```

Start the backend server:
```bash
node server.js
```

The backend will run on `http://localhost:4000`

### 2. Setup Frontend

In the project root:

```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Frontend**: Next.js app using assistant-ui React library for the chat UI
   - Uses `useEdgeRuntime` hook from assistant-ui to connect to the API
   - Assistant-ui provides ThreadPrimitive, ComposerPrimitive, and MessagePrimitive components
   - Custom styled message components with role-based styling (user vs assistant)

2. **Backend**: Express.js server with LangChain handling OpenAI API calls
   - Receives messages array from frontend
   - Processes through LangChain's ChatOpenAI model
   - Returns complete response (non-streaming)

3. **API Route**: Next.js API route (`/app/api/chat/route.ts`) acts as a proxy
   - Forwards requests from assistant-ui to the backend
   - Converts backend JSON response to streaming format for compatibility
   - Handles errors gracefully

## Technologies Used

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- assistant-ui React library

### Backend
- Node.js
- Express.js
- LangChain
- OpenAI API

## API Endpoints

### Backend (Port 3001)

- `POST /api/chat` - Send chat messages and receive streaming responses
  - Request body: `{ messages: Array<{ role: string, content: string }> }`
  - Response: Server-Sent Events stream with AI response

- `GET /health` - Health check endpoint
  - Response: `{ status: "ok", message: "LangChain backend is running" }`
