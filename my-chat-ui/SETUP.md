# My Chat UI - Setup Guide

This is a custom Agent Chat UI built with Vite + React that connects to your Simple LangGraph Server.

## 🏗️ Architecture

```
┌─────────────────────┐    HTTP API    ┌──────────────────────┐
│   My Chat UI        │ ──────────────► │ Simple LangGraph     │
│   (React + Vite)    │                │ Server (Express)     │
│   Port: 5173        │                │ Port: 2024           │
└─────────────────────┘                └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Simple LangGraph Server must be running first**
   ```bash
   cd ../simple-langgraph-server
   npm start
   ```
   The server should be running on `http://localhost:2024`

### Option 1: Using the Startup Script (Recommended)

```bash
./start-dev.sh
```

This script will:
- ✅ Check if the LangGraph server is running
- ✅ Set the correct environment variables
- ✅ Start the Chat UI development server

### Option 2: Manual Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```bash
   export VITE_API_URL=http://localhost:2024
   export VITE_ASSISTANT_ID=agent
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🌐 Access the Chat UI

Once running, open your browser to:
**http://localhost:5173**

The UI will automatically connect to your Simple LangGraph Server.

## 🔧 Configuration

The Chat UI can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:2024` | URL of your LangGraph server |
| `VITE_ASSISTANT_ID` | `agent` | Assistant/Graph ID to use |
| `VITE_LANGSMITH_API_KEY` | - | Optional: LangSmith API key for tracing |

## 📁 Project Structure

```
my-chat-ui/
├── apps/
│   ├── web/                    # React Chat UI (Vite)
│   │   ├── src/
│   │   │   ├── components/     # UI Components
│   │   │   ├── providers/      # React Context Providers
│   │   │   └── lib/           # Utilities
│   │   └── package.json
│   └── agents/                # LangGraph Agents (not used with Simple Server)
├── package.json               # Root package.json (Turbo monorepo)
├── start-dev.sh              # Development startup script
└── SETUP.md                  # This file
```

## 🔍 Troubleshooting

### Chat UI won't start
- **Check if Simple LangGraph Server is running**: `curl http://localhost:2024/health`
- **Check ports**: Make sure ports 2024 and 5173 are available
- **Check environment variables**: Ensure `VITE_API_URL` and `VITE_ASSISTANT_ID` are set

### Connection errors in browser
- **CORS issues**: The Simple LangGraph Server has CORS enabled for all origins
- **Network errors**: Check browser developer tools for specific error messages
- **API format**: The Simple LangGraph Server implements the LangGraph SDK API format

### Chat not working
- **Check server logs**: Look at the Simple LangGraph Server terminal for request logs
- **Check browser console**: Look for JavaScript errors in browser developer tools
- **Test API directly**: Use `curl` to test server endpoints manually

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Key Components

- **`Stream.tsx`** - Manages connection to LangGraph server
- **`Thread.tsx`** - Handles thread/conversation management  
- **`components/thread/`** - Chat UI components (messages, input, etc.)

## 🔗 Integration with Simple LangGraph Server

The Chat UI expects these endpoints from your server:

- `GET /info` - Returns available assistants
- `POST /threads/search` - Search for conversation threads
- `POST /threads` - Create new conversation thread
- `POST /threads/{id}/runs/stream` - Stream chat responses
- `POST /threads/{id}/history` - Get conversation history

Your Simple LangGraph Server implements all of these endpoints correctly.

## 🎯 Features

- ✅ **Real-time streaming** - See AI responses as they're generated
- ✅ **Conversation history** - Browse previous conversations
- ✅ **Thread management** - Create and switch between conversations
- ✅ **Tool calls** - View AI tool usage (if your agent uses tools)
- ✅ **Responsive design** - Works on desktop and mobile
- ✅ **Dark/light mode** - Automatic theme switching

## 📝 Notes

- This Chat UI is designed to work specifically with the Simple LangGraph Server
- It uses the LangGraph SDK (`@langchain/langgraph-sdk`) for server communication
- The UI automatically handles message formatting and streaming
- No additional configuration needed beyond setting the server URL and assistant ID
