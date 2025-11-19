# Simple LangGraph Server

A simple LangGraph server compatible with the [Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui). This server provides a basic conversational agent using OpenAI's GPT-3.5-turbo model.

## Features

- ✅ Compatible with Agent Chat UI
- 🤖 Uses OpenAI GPT-3.5-turbo
- 📡 Supports streaming responses
- 🧵 Thread management
- 📊 Optional LangSmith tracing
- 🔄 RESTful API following LangGraph server specification

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
LANGSMITH_API_KEY=your_langsmith_api_key_here  # Optional
PORT=2024
ASSISTANT_ID=agent
```

### 3. Build and Start the Server

```bash
npm run build
npm start
```

Or for development:

```bash
npm run dev
```

### 4. Connect with Agent Chat UI

Once the server is running, you can connect it with the Agent Chat UI:

🌐 **[Open Agent Chat UI](https://agentchat.vercel.app/?apiUrl=http://localhost:2024&assistantId=agent)**

Or manually configure:
- **API URL**: `http://localhost:2024`
- **Assistant ID**: `agent`

## API Endpoints

The server implements the LangGraph server API specification:

### Server Info
- `GET /` - Server information
- `GET /health` - Health check
- `GET /info` - Returns available assistants (required by Agent Chat UI)

### Assistants
- `GET /assistants` - List all assistants
- `GET /assistants/{assistant_id}` - Get specific assistant

### Threads
- `GET /assistants/{assistant_id}/threads` - List threads for assistant
- `POST /assistants/{assistant_id}/threads` - Create new thread
- `GET /assistants/{assistant_id}/threads/{thread_id}` - Get specific thread
- `POST /threads/search` - Search threads (used by Agent Chat UI)

### Runs
- `POST /assistants/{assistant_id}/threads/{thread_id}/runs` - Create and execute run
- `GET /assistants/{assistant_id}/threads/{thread_id}/runs/{run_id}/stream` - Stream run results

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | Your OpenAI API key |
| `LANGSMITH_API_KEY` | ❌ No | - | LangSmith API key for tracing |
| `PORT` | ❌ No | `2024` | Server port |
| `ASSISTANT_ID` | ❌ No | `agent` | Assistant identifier |
| `LANGCHAIN_TRACING_V2` | ❌ No | `true` | Enable LangSmith tracing |
| `LANGCHAIN_PROJECT` | ❌ No | `simple-langgraph-server` | LangSmith project name |

### Model Configuration

The server uses OpenAI's GPT-3.5-turbo model with:
- Temperature: 0.7
- Streaming support enabled

You can modify the model configuration in `src/server.ts`:

```typescript
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",  // or "gpt-4", "gpt-4-turbo", etc.
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
});
```

## Development

### Project Structure

```
simple-langgraph-server/
├── src/
│   └── server.ts          # Main server implementation
├── dist/                  # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── env.example           # Environment variables template
└── README.md
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the compiled server
- `npm run dev` - Build and start in one command
- `npm run clean` - Remove compiled files

### Adding Features

The server is built with extensibility in mind. You can:

1. **Add new tools**: Extend the LangGraph workflow with additional nodes
2. **Customize the model**: Change model parameters or provider
3. **Add authentication**: Implement API key validation
4. **Add persistence**: Replace in-memory storage with a database
5. **Add custom endpoints**: Extend the Express server with additional routes

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY is required" error**
   - Make sure you've created a `.env` file with your OpenAI API key

2. **Port already in use**
   - Change the `PORT` in your `.env` file or stop other services using port 2024

3. **Agent Chat UI can't connect**
   - Ensure the server is running on the correct port
   - Check that the API URL in Agent Chat UI matches your server URL
   - Verify CORS is properly configured (it should work by default)

4. **No streaming responses**
   - Check your OpenAI API key has sufficient credits
   - Verify the model name is correct and available

### Logs

The server provides detailed logging:
- 🔍 Request logging (method, path, query, body)
- 🚀 Run start/completion
- ✅ Success indicators
- ❌ Error messages

## License

MIT License - see the original [Agent Chat UI repository](https://github.com/langchain-ai/agent-chat-ui) for more details.
