import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const app = express();

// CORS configuration for Agent Chat UI
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Api-Key"],
  credentials: true,
}));

app.use(express.json());

// Configuration
const PORT = process.env.PORT || 2024;
const ASSISTANT_ID = process.env.ASSISTANT_ID || "agent";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("OPENAI_API_KEY", OPENAI_API_KEY);

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is required. Please set it in your .env file.");
  process.exit(1);
}

// Initialize OpenAI model
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
});

// Simple chat function
async function processChat(messages: BaseMessage[]): Promise<AIMessage> {
  const response = await model.invoke(messages);
  return response as AIMessage;
}

// In-memory storage for threads
const threads = new Map<string, { messages: BaseMessage[], created_at: string, updated_at: string }>();

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n🔍 ${req.method} ${req.path}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`📋 Query:`, req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📋 Body:`, JSON.stringify(req.body, null, 2).substring(0, 500));
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Simple LangGraph Server is running" });
});

// Root endpoint - returns server info
app.get("/", (req, res) => {
  res.json({
    name: "Simple LangGraph Server",
    version: "1.0.0",
    status: "running",
    assistant_id: ASSISTANT_ID,
    endpoints: [
      "/health",
      "/info",
      "/assistants",
      `/assistants/${ASSISTANT_ID}/threads`
    ]
  });
});

// GET /info - Server info endpoint (Agent Chat UI checks this first)
app.get("/info", (req, res) => {
  // Agent Chat UI expects assistants as a direct array
  const assistants = [
    {
      assistant_id: ASSISTANT_ID,
      name: "Simple Agent",
      description: "A simple conversational agent using OpenAI GPT-3.5-turbo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: {
        configurable: {
          model_name: "gpt-3.5-turbo",
          temperature: 0.7
        }
      },
      metadata: {
        created_by: "simple-langgraph-server"
      }
    }
  ];
  
  console.log("🔍 /info - returning assistants array");
  res.json(assistants);
});

// GET /assistants - List assistants
app.get("/assistants", (req, res) => {
  const assistants = [
    {
      assistant_id: ASSISTANT_ID,
      name: "Simple Agent",
      description: "A simple conversational agent using OpenAI GPT-3.5-turbo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: {
        configurable: {
          model_name: "gpt-3.5-turbo",
          temperature: 0.7
        }
      },
      metadata: {
        created_by: "simple-langgraph-server"
      }
    }
  ];
  
  res.json({ data: assistants });
});

// GET /assistants/{assistant_id} - Get specific assistant
app.get(`/assistants/:assistantId`, (req, res) => {
  const { assistantId } = req.params;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  res.json({
    assistant_id: ASSISTANT_ID,
    name: "Simple Agent",
    description: "A simple conversational agent using OpenAI GPT-3.5-turbo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    config: {
      configurable: {
        model_name: "gpt-3.5-turbo",
        temperature: 0.7
      }
    },
    metadata: {
      created_by: "simple-langgraph-server"
    }
  });
});

// GET /assistants/{assistant_id}/threads - List threads for assistant
app.get(`/assistants/:assistantId/threads`, (req, res) => {
  const { assistantId } = req.params;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  const threadList = Array.from(threads.entries()).map(([threadId, thread]) => ({
    thread_id: threadId,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    metadata: {},
    status: "idle",
    config: {},
    values: {
      messages: thread.messages
    }
  }));
  
  res.json({ data: threadList });
});

// POST /assistants/{assistant_id}/threads - Create new thread
app.post(`/assistants/:assistantId/threads`, (req, res) => {
  const { assistantId } = req.params;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  const threadId = uuidv4();
  const now = new Date().toISOString();
  
  threads.set(threadId, {
    messages: [],
    created_at: now,
    updated_at: now
  });
  
  console.log(`✅ Created thread: ${threadId}`);
  
  res.json({
    thread_id: threadId,
    created_at: now,
    updated_at: now,
    metadata: {},
    status: "idle",
    config: {},
    values: {
      messages: []
    }
  });
});

// GET /assistants/{assistant_id}/threads/{thread_id} - Get specific thread
app.get(`/assistants/:assistantId/threads/:threadId`, (req, res) => {
  const { assistantId, threadId } = req.params;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  const thread = threads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  res.json({
    thread_id: threadId,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    metadata: {},
    status: "idle",
    config: {},
    values: {
      messages: thread.messages
    }
  });
});

// POST /assistants/{assistant_id}/threads/{thread_id}/runs - Create and run
app.post(`/assistants/:assistantId/threads/:threadId/runs`, async (req, res) => {
  const { assistantId, threadId } = req.params;
  const { input } = req.body;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  let thread = threads.get(threadId);
  if (!thread) {
    // Create thread if it doesn't exist
    const now = new Date().toISOString();
    thread = {
      messages: [],
      created_at: now,
      updated_at: now
    };
    threads.set(threadId, thread);
  }
  
  const runId = uuidv4();
  
  console.log(`🚀 Starting run ${runId} for thread ${threadId}`);
  console.log(`📝 Input:`, input);
  
  // Add user message to thread
  if (typeof input === "string") {
    const userMessage = new HumanMessage(input);
    thread.messages.push(userMessage);
  }
  
  res.json({
    run_id: runId,
    thread_id: threadId,
    assistant_id: assistantId,
    status: "running",
    created_at: new Date().toISOString()
  });
  
  // Process the run asynchronously
  setImmediate(async () => {
    try {
      // Process chat with the model
      const aiResponse = await processChat(thread!.messages);
      
      // Add AI response to thread
      thread!.messages.push(aiResponse);
      thread!.updated_at = new Date().toISOString();
      
      console.log(`✅ Completed run ${runId}`);
    } catch (error) {
      console.error(`❌ Error in run ${runId}:`, error);
    }
  });
});

// GET /assistants/{assistant_id}/threads/{thread_id}/runs/{run_id}/stream - Stream run results
app.get(`/assistants/:assistantId/threads/:threadId/runs/:runId/stream`, async (req, res) => {
  const { assistantId, threadId, runId } = req.params;
  
  if (assistantId !== ASSISTANT_ID) {
    return res.status(404).json({ error: "Assistant not found" });
  }
  
  const thread = threads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  console.log(`📡 Streaming run ${runId} for thread ${threadId}`);
  
  try {
    // Send run start event
    res.write(`event: run_start\n`);
    res.write(`data: ${JSON.stringify({ run_id: runId, event: "run_start" })}\n\n`);
    
    // Get the last user message
    const userMessages = thread.messages.filter(msg => msg instanceof HumanMessage);
    if (userMessages.length === 0) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: "No user message found" })}\n\n`);
      res.end();
      return;
    }
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Stream the model response
    const stream = await model.stream([lastUserMessage]);
    
    let fullContent = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        
        // Send message chunk
        res.write(`event: values\n`);
          res.write(`data: ${JSON.stringify({
            messages: [{
              content: [
                {
                  type: "text",
                  text: fullContent
                }
              ],
              id: uuidv4(),
              type: "ai"
            }]
          })}\n\n`);
      }
    }
    
    // Add the complete message to thread
    const aiMessage = new AIMessage(fullContent);
    thread.messages.push(aiMessage);
    thread.updated_at = new Date().toISOString();
    
    // Send run end event
    res.write(`event: run_end\n`);
    res.write(`data: ${JSON.stringify({ run_id: runId, event: "run_end" })}\n\n`);
    
    res.end();
    
    console.log(`✅ Completed streaming run ${runId}`);
  } catch (error) {
    console.error(`❌ Error streaming run ${runId}:`, error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
    res.end();
  }
});

// POST /threads - Create thread (Agent Chat UI might use this)
app.post("/threads", (req, res) => {
  const threadId = uuidv4();
  const now = new Date().toISOString();
  
  threads.set(threadId, {
    messages: [],
    created_at: now,
    updated_at: now
  });
  
  console.log(`✅ Created thread via /threads: ${threadId}`);
  
  res.json({
    thread_id: threadId,
    created_at: now,
    updated_at: now,
    metadata: {},
    status: "idle",
    config: {},
    values: {
      messages: []
    }
  });
});

// POST /threads/{thread_id}/history - Get thread history
// NOTE: LangGraph SDK expects this endpoint to return an ARRAY of
// checkpoint states, NOT an object. Each state should have:
// - checkpoint: { checkpoint_id, parent_checkpoint? }
// - parent_checkpoint?: { checkpoint_id } | null
// - values: { messages: [...] }
app.post("/threads/:threadId/history", (req, res) => {
  const { threadId } = req.params;
  const { limit = 10 } = req.body;

  const thread = threads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  console.log(`📜 Getting history for thread ${threadId}, limit: ${limit}`);

  // Build LangGraph-style state history.
  // For our simple server we treat the entire message list as a single checkpoint.
  const messages = thread.messages.slice(-limit).map((msg, index) => {
    if (msg instanceof HumanMessage) {
      return {
        id: `msg-${index}`,
        type: "human",
        content: [
          {
            type: "text",
            text: msg.content,
          },
        ],
      };
    } else if (msg instanceof AIMessage) {
      return {
        id: `msg-${index}`,
        type: "ai",
        content: [
          {
            type: "text",
            text: msg.content,
          },
        ],
      };
    }
    return null;
  }).filter(Boolean);

  const safeMessages = Array.isArray(messages) ? messages : [];

  // Single checkpoint representing the latest state of the thread.
  const state = {
    checkpoint: {
      checkpoint_id: `checkpoint-${threadId}-latest`,
      parent_checkpoint: null,
    },
    parent_checkpoint: null,
    values: {
      messages: safeMessages,
    },
    // Optional fields used by SDK, kept minimal
    tasks: [],
    next: [],
  };

  // LangGraph React SDK expects an array here so it can call
  // history.forEach(...) and result.at(0)
  res.json([state]);
});

// GET /threads/{thread_id}/history - Alternative GET endpoint for thread history
app.get("/threads/:threadId/history", (req, res) => {
  const { threadId } = req.params;
  const limit = parseInt(req.query.limit as string) || 1000;
  
  const thread = threads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  console.log(`📜 Getting history (GET) for thread ${threadId}, limit: ${limit}`);
  
  // Return the messages as an array (for getBranchSequence)
  const messages = thread.messages.slice(-limit).map((msg, index) => {
    if (msg instanceof HumanMessage) {
      return {
        id: `msg-${index}`,
        type: "human",
        content: [
          {
            type: "text",
            text: msg.content
          }
        ],
        checkpoint: {
          checkpoint_id: `checkpoint-${index}`,
          parent_checkpoint: index > 0 ? { checkpoint_id: `checkpoint-${index-1}` } : null
        }
      };
    } else if (msg instanceof AIMessage) {
      return {
        id: `msg-${index}`,
        type: "ai",
        content: [
          {
            type: "text",
            text: msg.content
          }
        ],
        checkpoint: {
          checkpoint_id: `checkpoint-${index}`,
          parent_checkpoint: index > 0 ? { checkpoint_id: `checkpoint-${index-1}` } : null
        }
      };
    }
    return null;
  }).filter(Boolean);
  
  // Return in the format Agent Chat UI expects
  res.json({
    values: {
      messages: Array.isArray(messages) ? messages : []
    }
  });
});

// POST /threads/{thread_id}/runs/stream - Create and stream run (Agent Chat UI uses this)
app.post("/threads/:threadId/runs/stream", async (req, res) => {
  const { threadId } = req.params;
  const { input } = req.body;
  
  let thread = threads.get(threadId);
  if (!thread) {
    // Create thread if it doesn't exist
    const now = new Date().toISOString();
    thread = {
      messages: [],
      created_at: now,
      updated_at: now
    };
    threads.set(threadId, thread);
  }
  
  const runId = uuidv4();
  
  console.log(`🚀 Starting streaming run ${runId} for thread ${threadId}`);
  console.log(`📝 Input:`, input);
  
  // Add user message to thread
  if (typeof input === "string") {
    const userMessage = new HumanMessage(input);
    thread.messages.push(userMessage);
  } else if (input && typeof input === "object") {
    // Handle complex input format from Agent Chat UI
    if (input.messages && Array.isArray(input.messages)) {
      // Process each message in the input
      input.messages.forEach((msg: any) => {
        if (msg.type === "human" && msg.content) {
          let text = "";
          
          // Extract text from content array
          if (Array.isArray(msg.content)) {
            text = msg.content
              .filter((item: any) => item.type === "text")
              .map((item: any) => item.text)
              .join(" ");
          } else if (typeof msg.content === "string") {
            text = msg.content;
          }
          
          if (text) {
            const userMessage = new HumanMessage(text);
            thread.messages.push(userMessage);
            console.log(`📝 Added user message: "${text}"`);
          }
        }
      });
    }
  }
  
  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  try {
    // Send run start event
    res.write(`event: run_start\n`);
    res.write(`data: ${JSON.stringify({ run_id: runId, event: "run_start" })}\n\n`);
    
    // Get the last user message
    const userMessages = thread.messages.filter(msg => msg instanceof HumanMessage);
    if (userMessages.length === 0) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: "No user message found" })}\n\n`);
      res.end();
      return;
    }
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Stream the model response
    const stream = await model.stream([lastUserMessage]);
    
    let fullContent = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        
        // Send message chunk
        res.write(`event: values\n`);
          res.write(`data: ${JSON.stringify({
            messages: [{
              content: [
                {
                  type: "text",
                  text: fullContent
                }
              ],
              id: uuidv4(),
              type: "ai"
            }]
          })}\n\n`);
      }
    }
    
    // Add the complete message to thread
    const aiMessage = new AIMessage(fullContent);
    thread.messages.push(aiMessage);
    thread.updated_at = new Date().toISOString();
    
    // Send run end event
    res.write(`event: run_end\n`);
    res.write(`data: ${JSON.stringify({ run_id: runId, event: "run_end" })}\n\n`);
    
    res.end();
    
    console.log(`✅ Completed streaming run ${runId}`);
  } catch (error) {
    console.error(`❌ Error streaming run ${runId}:`, error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
    res.end();
  }
});

// POST /threads/search - Search threads (Agent Chat UI uses this)
app.post("/threads/search", (req, res) => {
  const { metadata, limit = 100 } = req.body;
  
  console.log("🔍 Thread search with metadata:", metadata);
  
  // For simplicity, return all threads
  const allThreads = Array.from(threads.entries()).map(([threadId, thread]) => ({
    thread_id: threadId,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    metadata: {},
    status: "idle",
    config: {},
    values: {
      messages: thread.messages.map((msg, index) => {
        if (msg instanceof HumanMessage) {
          return {
            id: `msg-${index}`,
            type: "human",
            content: [
              {
                type: "text",
                text: msg.content
              }
            ]
          };
        } else if (msg instanceof AIMessage) {
          return {
            id: `msg-${index}`,
            type: "ai",
            content: [
              {
                type: "text",
                text: msg.content
              }
            ]
          };
        }
        return null;
      }).filter(Boolean)
    }
  }));
  
  // Apply limit and ensure it's always an array
  const limitedThreads = Array.isArray(allThreads) ? allThreads.slice(0, limit) : [];
  
  console.log(`📋 Returning ${limitedThreads.length} threads`);
  res.json({ data: limitedThreads });
});

// Catch-all for missing endpoints
app.use((req, res) => {
  console.log(`\n❌ 404 - MISSING ENDPOINT: ${req.method} ${req.path}`);
  
  // Return appropriate error response
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Simple LangGraph Server running on http://localhost:${PORT}`);
  console.log(`📡 Compatible with Agent Chat UI at: https://agentchat.vercel.app/?apiUrl=http://localhost:${PORT}&assistantId=${ASSISTANT_ID}`);
  console.log(`🤖 Assistant ID: ${ASSISTANT_ID}`);
  console.log(`🔑 Using OpenAI API Key: ${OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.LANGSMITH_API_KEY) {
    console.log(`📊 LangSmith tracing: ✅ Enabled`);
  } else {
    console.log(`📊 LangSmith tracing: ⚠️ Disabled (set LANGSMITH_API_KEY to enable)`);
  }
  
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /info`);
  console.log(`   GET  /assistants`);
  console.log(`   GET  /assistants/${ASSISTANT_ID}/threads`);
  console.log(`   POST /assistants/${ASSISTANT_ID}/threads`);
  console.log(`   POST /threads`);
  console.log(`   POST /threads/{thread_id}/history`);
  console.log(`   POST /threads/{thread_id}/runs/stream`);
  console.log(`   POST /threads/search`);
  console.log(`\n🌐 Ready to connect with Agent Chat UI!`);
});
