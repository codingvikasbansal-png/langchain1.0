# LangChain Backend Server

A Node.js backend using LangChain for chat functionality with OpenAI.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file in the backend directory:
```
OPENAI_API_KEY=sk-your-api-key-here
PORT=3001
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Endpoints

- `POST /api/chat` - Send messages and receive streaming responses
- `GET /health` - Health check endpoint

## Usage

The server runs on `http://localhost:3001` by default.

To use with the frontend, update the API endpoint in the frontend configuration.





