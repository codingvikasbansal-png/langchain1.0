import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { createAgent, tool } from "langchain";
import * as z from "zod";

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

// Initialize OpenAI model using LangChain 1.0 syntax
const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  apiKey: OPENAI_API_KEY,
});

// ------------------------------------
// TOOLS - LangChain 1.0 Style
// ------------------------------------
const getWeather = tool(
  ({ city }) => `It's always sunny in ${city}!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("City name to get weather for"),
    }),
  }
);

const generatePieChart = tool(
  ({ labels, values }) => {
    return {
      type: "pie_chart",
      labels,
      values,
      message: "Pie chart data generated successfully.",
    };
  },
  {
    name: "generate_pie_chart",
    description: "Generate pie chart data. User will give categories + values. Extract them cleanly.",
    schema: z.object({
      labels: z
        .array(z.string())
        .describe("Labels for pie chart slices. Example: ['Apples', 'Bananas']"),
      values: z
        .array(z.number())
        .describe("Numeric values for each label. Must match the labels count. Example: [10, 20]"),
    }),
  }
);

const generateTable = tool(
  ({ columns, rows }) => {
    return {
      type: "table",
      columns,
      rows,
      message: "Table data generated successfully.",
    };
  },
  {
    name: "generate_table",
    description: "Generate a data table with columns and rows. User will provide tabular data in various formats: JSON, HTML tables, markdown tables, natural language, or CSV-like text. Extract column headers and row data cleanly from any format.",
    schema: z.object({
      columns: z
        .array(z.string())
        .describe("Column headers for the table. Extract from <th> tags in HTML, first row in markdown, or from the data structure. Example: ['Name', 'Age', 'City']"),
      rows: z
        .array(z.record(z.string(), z.any()))
        .describe("Array of row objects where keys are column names. Extract from <tr><td> tags in HTML, rows in markdown, or from the data structure. Preserve data types (numbers as numbers, strings as strings). Example: [{ 'Name': 'John', 'Age': 30, 'City': 'NYC' }]"),
    }),
  }
);

// ------------------------------------
// AGENT - LangChain 1.0 createAgent
// ------------------------------------
const agent = createAgent({
  model,
  tools: [getWeather, generatePieChart, generateTable],
  systemPrompt: `
You are a helpful assistant with the ability to generate visualizations and get weather information.

If the user asks to draw, plot, make, or generate a PIE CHART:
→ Parse labels + values from their input.
→ Call the "generate_pie_chart" tool with clean structured data.
Example: "make pie chart of apples 10, oranges 20"
→ Call: generate_pie_chart(labels:["apples","oranges"], values:[10,20])
→ After calling the tool, simply acknowledge that you've generated the pie chart. DO NOT include markdown images or placeholders like ![Pie Chart](PIE_CHART_IMAGE_URL).

If the user asks to create, show, make, or generate a TABLE:
→ Parse column headers and row data from their input. The input can be in ANY format:
  • JSON format: {"columns": [...], "rows": [...]} or similar structures
  • HTML table format: <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>
  • Markdown table format: | col1 | col2 |\n|------|------|\n| val1 | val2 |
  • Natural language: "make a table with Name, Age, City columns for John 30 NYC and Jane 25 LA"
  • CSV-like text or other tabular formats
→ For HTML tables: Extract <th> elements as columns, <td> elements in <tr> as row data
→ For markdown tables: Extract headers from first row (| col1 | col2 |), data from subsequent rows
→ For JSON: Use the provided structure directly
→ For natural language: Extract table structure from the description
→ Call the "generate_table" tool with columns array and rows array of objects.
→ Preserve data types: numbers should remain numbers, strings remain strings
Examples:
  - Natural language: "make a table with Name, Age, City columns for John 30 NYC and Jane 25 LA"
    → Call: generate_table(columns:["Name","Age","City"], rows:[{"Name":"John","Age":30,"City":"NYC"},{"Name":"Jane","Age":25,"City":"LA"}])
  - HTML: <table><thead><tr><th>brand</th><th>inventory</th></tr></thead><tbody><tr><td>Polo</td><td>820</td></tr></tbody></table>
    → Call: generate_table(columns:["brand","inventory"], rows:[{"brand":"Polo","inventory":820}])
  - Markdown: | id | name |\n|----|------|\n| 1 | Alice |
    → Call: generate_table(columns:["id","name"], rows:[{"id":1,"name":"Alice"}])
→ After calling the tool, simply acknowledge that you've generated the table. DO NOT include markdown tables or HTML tables in your response. The table will be displayed automatically by the system.

If the user asks about weather:
→ Call the "get_weather" tool with the city name.

IMPORTANT: When generating tables, ensure:
- Columns are an array of strings
- Rows are an array of objects where each key matches a column name
- Data types are preserved (numbers as numbers, strings as strings)
- You can parse tables from JSON, HTML, markdown, natural language, or any tabular format
- For HTML tables: Extract <th> tags for columns, <tr><td> tags for rows
- For HTML numeric values: Convert string numbers to actual numbers (e.g., "820.00" → 820.00)
- NEVER include markdown tables (| col1 | col2 |) in your response after calling generate_table
- NEVER include HTML tables (<table>...</table>) in your response after calling generate_table
- NEVER include markdown images or placeholders after calling generate_pie_chart

Otherwise, answer normally.
`,
});

// Simple chat function using the new agent
async function processChat(messages: BaseMessage[]): Promise<AIMessage> {
  const response = await agent.invoke({ messages });
  // Extract the last AI message from the response
  const aiMessages = response.messages.filter(msg => msg instanceof AIMessage);
  return aiMessages[aiMessages.length - 1] as AIMessage;
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
        id: msg.id || `msg-${index}`,
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
        id: msg.id || `msg-${index}`,
        type: "ai",
        content: [
          {
            type: "text",
            text: msg.content,
          },
        ],
        ...(msg.tool_calls && msg.tool_calls.length > 0 ? {
          tool_calls: msg.tool_calls.map(tc => ({
            id: tc.id,
            name: tc.name,
            args: tc.args,
            type: "tool_call"
          }))
        } : {})
      };
    } else if (msg instanceof ToolMessage) {
      // Preserve tool result messages
      let toolContent: string;
      if (typeof msg.content === "string") {
        toolContent = msg.content;
      } else if (typeof msg.content === "object" && msg.content !== null) {
        toolContent = JSON.stringify(msg.content);
      } else {
        toolContent = String(msg.content);
      }
      
      return {
        id: msg.id || `msg-${index}`,
        type: "tool",
        content: toolContent,
        name: (msg as any).name || "tool",
        tool_call_id: (msg as any).tool_call_id
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
        id: msg.id || `msg-${index}`,
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
        id: msg.id || `msg-${index}`,
        type: "ai",
        content: [
          {
            type: "text",
            text: msg.content
          }
        ],
        ...(msg.tool_calls && msg.tool_calls.length > 0 ? {
          tool_calls: msg.tool_calls.map(tc => ({
            id: tc.id,
            name: tc.name,
            args: tc.args,
            type: "tool_call"
          }))
        } : {}),
        checkpoint: {
          checkpoint_id: `checkpoint-${index}`,
          parent_checkpoint: index > 0 ? { checkpoint_id: `checkpoint-${index-1}` } : null
        }
      };
    } else if (msg instanceof ToolMessage) {
      // Preserve tool result messages
      let toolContent: string;
      if (typeof msg.content === "string") {
        toolContent = msg.content;
      } else if (typeof msg.content === "object" && msg.content !== null) {
        toolContent = JSON.stringify(msg.content);
      } else {
        toolContent = String(msg.content);
      }
      
      return {
        id: msg.id || `msg-${index}`,
        type: "tool",
        content: toolContent,
        name: (msg as any).name || "tool",
        tool_call_id: (msg as any).tool_call_id,
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
    
    // Use the agent to process the conversation (this will handle tool calls)
    console.log(`🤖 Invoking agent with ${thread.messages.length} messages`);
    const agentResponse = await agent.invoke({ messages: thread.messages });
    
    console.log(`📦 Agent returned ${agentResponse.messages.length} messages`);
    
    // Process all messages from agent response (includes tool calls and results)
    const allNewMessages: BaseMessage[] = [];
    let lastAIMessage: AIMessage | null = null;
    
    // Find new messages that aren't already in the thread
    const existingMessageIds = new Set(thread.messages.map(m => m.id || ''));
    
    for (const msg of agentResponse.messages) {
      if (!existingMessageIds.has(msg.id || '')) {
        allNewMessages.push(msg);
        if (msg instanceof AIMessage) {
          lastAIMessage = msg;
        }
        const msgType = msg.constructor.name;
        const toolCallsInfo = msg instanceof AIMessage && msg.tool_calls 
          ? ` with ${msg.tool_calls.length} tool calls` 
          : '';
        console.log(`📝 New message: ${msgType}${toolCallsInfo}`);
      }
    }
    
    // Add all new messages to thread (including tool calls and tool results)
    allNewMessages.forEach(msg => {
      thread.messages.push(msg);
    });
    
    // Build a map of tool_call_id to tool name for matching
    const toolCallIdToName = new Map<string, string>();
    for (const msg of allNewMessages) {
      if (msg instanceof AIMessage && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          if (tc.id) {
            toolCallIdToName.set(tc.id, tc.name);
          }
        }
      }
    }
    
    // Stream all new messages in order (AI messages with tool calls, tool results, final AI response)
    // Build complete message list for streaming
    const allMessagesToSend = allNewMessages.map((msg, idx) => {
      if (msg instanceof AIMessage) {
        const content = typeof msg.content === "string" 
          ? [{ type: "text", text: msg.content }]
          : Array.isArray(msg.content) 
            ? msg.content 
            : [{ type: "text", text: String(msg.content) }];
        
        return {
          id: msg.id || `msg-${idx}`,
          type: "ai",
          content,
          ...(msg.tool_calls && msg.tool_calls.length > 0 ? {
            tool_calls: msg.tool_calls.map(tc => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
              type: "tool_call"
            }))
          } : {})
        };
      } else if (msg instanceof ToolMessage) {
        // Get tool name from the tool call that triggered this result
        const toolCallId = (msg as any).tool_call_id;
        const toolName = toolCallIdToName.get(toolCallId) || (msg as any).name || "unknown";
        
        // Ensure content is properly formatted
        let toolContent: string;
        if (typeof msg.content === "string") {
          toolContent = msg.content;
        } else if (typeof msg.content === "object" && msg.content !== null) {
          toolContent = JSON.stringify(msg.content);
        } else {
          toolContent = String(msg.content);
        }
        
        console.log(`🔧 Tool result for "${toolName}":`, toolContent.substring(0, 200));
        
        // Ensure tool messages have a stable id. Prefer existing id, then toolCallId, else generate a UUID.
        const assignedToolId = msg.id || toolCallId || uuidv4();
        return {
          id: assignedToolId,
          type: "tool",
          content: toolContent,
          name: toolName, // Use the tool name from the tool call
          tool_call_id: toolCallId
        };
      }
      return null;
    }).filter(Boolean);
    
    // Send all messages in one values event
    if (allMessagesToSend.length > 0) {
      console.log(`📤 Sending ${allMessagesToSend.length} messages (including tool calls/results)`);
      res.write(`event: values\n`);
      res.write(`data: ${JSON.stringify({
        messages: allMessagesToSend
      })}\n\n`);
    }
    
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
