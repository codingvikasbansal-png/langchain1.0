import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
const app = express();
app.use(cors());
app.use(bodyParser.json());
// ------------------------------------
// TOOL 1: Weather
// ------------------------------------
const getWeather = tool(async ({ city }) => `It's always sunny in ${city}!`, {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
        city: z.string().describe("City name to get weather for"),
    }),
});
// ------------------------------------
// TOOL 2: Pie Chart
// ------------------------------------
const generatePieChart = tool(async ({ labels, values }) => {
    return {
        type: "pie_chart",
        labels,
        values,
        message: "Pie chart data generated successfully.",
    };
}, {
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
});
// ------------------------------------
// GENERATE TABLE TOOL
// ------------------------------------
const generateTable = tool(async ({ columns, rows }) => {
    return {
        type: "table",
        columns,
        rows,
        message: "Table data generated successfully.",
    };
}, {
    name: "generate_table",
    description: "Generate a data table with columns and rows. User will provide tabular data. Extract column headers and row data cleanly.",
    schema: z.object({
        columns: z
            .array(z.string())
            .describe("Column headers for the table. Example: ['Name', 'Age', 'City']"),
        rows: z
            .array(z.record(z.any()))
            .describe("Array of row objects where keys are column names. Example: [{ 'Name': 'John', 'Age': 30, 'City': 'NYC' }]"),
    }),
});
// ------------------------------------
// AGENT
// ------------------------------------
const agent = createAgent({
    model: new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
    }),
    systemPrompt: `
You are a helpful assistant with the ability to generate visualizations.

If the user asks to draw, plot, make, or generate a PIE CHART:
→ Parse labels + values from their input.
→ Call the "generate_pie_chart" tool with clean structured data.
Example: "make pie chart of apples 10, oranges 20"
→ Call: generate_pie_chart(labels:["apples","oranges"], values:[10,20])

If the user asks to create, show, make, or generate a TABLE:
→ Parse column headers and row data from their input.
→ Call the "generate_table" tool with columns array and rows array of objects.
Example: "make a table with Name, Age, City columns for John 30 NYC and Jane 25 LA"
→ Call: generate_table(columns:["Name","Age","City"], rows:[{"Name":"John","Age":30,"City":"NYC"},{"Name":"Jane","Age":25,"City":"LA"}])

IMPORTANT: When generating tables, ensure:
- Columns are an array of strings
- Rows are an array of objects where each key matches a column name
- Data types are preserved (numbers as numbers, strings as strings)

Otherwise, answer normally.
`,
    tools: [getWeather, generatePieChart, generateTable],
});
// ------------------------------------
// /message endpoint (legacy)
// ------------------------------------
app.post("/message", async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "message is required" });
        }
        const response = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content: userMessage,
                },
            ],
        });
        // return raw LangChain agent output
        return res.json(response);
    }
    catch (err) {
        console.error("Agent error:", err);
        res.status(500).json({ error: err.message });
    }
});
// ------------------------------------
// /api/chat endpoint (Frontend compatible format)
// ------------------------------------
app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "messages array is required" });
        }
        // Extract text from frontend message format
        const langchainMessages = messages.map((msg) => {
            let text = "";
            console.log('📥 Backend received message:', JSON.stringify(msg, null, 2));
            // Frontend sends: { role: "user/assistant", content: [{ type: "text", text: "..." }] }
            if (msg.content) {
                if (typeof msg.content === "string") {
                    text = msg.content;
                }
                else if (Array.isArray(msg.content)) {
                    // Extract text from each content item
                    text = msg.content
                        .map((item) => {
                        if (!item || item.type !== "text")
                            return "";
                        // Text can be a string or nested object
                        if (typeof item.text === "string") {
                            return item.text;
                        }
                        else if (item.text && typeof item.text === "object") {
                            // Nested structure: item.text.parts[0].text
                            if (item.text.parts && Array.isArray(item.text.parts)) {
                                return item.text.parts
                                    .map((part) => {
                                    if (typeof part === "string")
                                        return part;
                                    if (part && part.text && typeof part.text === "string") {
                                        return part.text;
                                    }
                                    return "";
                                })
                                    .filter(Boolean)
                                    .join(" ");
                            }
                        }
                        return "";
                    })
                        .filter(Boolean)
                        .join(" ");
                }
            }
            // Fallback to parts format if content not found
            if (!text && msg.parts) {
                text = msg.parts
                    .filter((p) => p.type === "text" && p.text)
                    .map((p) => {
                    if (typeof p.text === "string")
                        return p.text;
                    return "";
                })
                    .join(" ");
            }
            console.log('📤 Extracted text:', text);
            return {
                role: msg.role,
                content: text || "",
            };
        });
        const response = await agent.invoke({ messages: langchainMessages });
        console.log('\n📦 RESPONSE MESSAGES:', response.messages.length);
        response.messages.forEach((msg, idx) => {
            console.log(`  [${idx}] ${msg.constructor.name}:`, {
                content: typeof msg.content === 'string' ? msg.content.substring(0, 100) : msg.content,
                tool_calls: msg.tool_calls || 'none',
            });
        });
        // Find tool call results (ToolMessage)
        let toolResult = null;
        for (const msg of response.messages) {
            if (msg.constructor.name === "ToolMessage") {
                console.log('\n🔧 TOOL MESSAGE FOUND:', msg);
                try {
                    // Tool result is in content, parse it
                    const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                    if (parsed && parsed.type) {
                        // Extract the tool name from the message name or parsed type
                        const toolName = msg.name || parsed.type;
                        // Format based on tool type
                        if (parsed.type === "table" || toolName === "generate_table") {
                            toolResult = {
                                toolName: "generate_table",
                                args: {
                                    columns: parsed.columns,
                                    rows: parsed.rows,
                                },
                            };
                        }
                        else if (parsed.type === "pie_chart" || toolName === "generate_pie_chart") {
                            toolResult = {
                                toolName: "generate_pie_chart",
                                args: {
                                    labels: parsed.labels,
                                    values: parsed.values,
                                },
                            };
                        }
                        else {
                            // Generic fallback
                            toolResult = {
                                toolName: toolName,
                                args: parsed,
                            };
                        }
                        console.log('✅ Parsed tool result:', toolResult);
                        break;
                    }
                }
                catch (e) {
                    console.log('⚠️ Failed to parse tool message:', e);
                }
            }
        }
        // Find the assistant message
        let assistantMessage = null;
        for (let i = response.messages.length - 1; i >= 0; i--) {
            const msg = response.messages[i];
            if (msg.constructor.name === "AIMessage") {
                assistantMessage = msg;
                break;
            }
        }
        if (!assistantMessage) {
            return res.status(500).json({ error: "No assistant message returned" });
        }
        // If we have a tool result, format it as JSON for the frontend
        let content = "";
        if (toolResult) {
            console.log('\n📤 Sending tool result to frontend:', toolResult);
            content = JSON.stringify(toolResult);
        }
        else {
            // Extract regular text content
            if (assistantMessage.content) {
                if (Array.isArray(assistantMessage.content)) {
                    content = assistantMessage.content
                        .map((c) => (typeof c === "string" ? c : c.text || JSON.stringify(c)))
                        .join("\n");
                }
                else {
                    content = String(assistantMessage.content);
                }
            }
        }
        // Ensure content is always a string
        if (typeof content !== "string") {
            content = String(content || "");
        }
        console.log('\n📨 Final content to send:', content.substring(0, 200));
        // Generate message ID
        const messageId = assistantMessage.id?.[1] || Date.now().toString();
        // Set streaming headers (required by frontend)
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // Frontend expects this EXACT format: 0:{"id":"...","role":"assistant","parts":[{"type":"text","text":"..."}]}
        const messageData = {
            id: String(messageId),
            role: "assistant",
            parts: [
                {
                    type: "text",
                    text: String(content), // Must be a string
                },
            ],
        };
        // Send in streaming format
        res.write(`0:${JSON.stringify(messageData)}\n`);
        res.end();
    }
    catch (err) {
        console.error("Agent error:", err);
        res.status(500).json({ error: err.message });
    }
});
// ------------------------------------
// Start Server
// ------------------------------------
app.listen(4000, () => {
    console.log("🚀 Server running on http://localhost:4000");
});
