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
// AGENT
// ------------------------------------
const agent = createAgent({
    model: new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
    }),
    systemPrompt: `
You are a helpful assistant.

If the user asks to draw, plot, make, or generate a PIE CHART:
→ Parse labels + values from their input.
→ Then call the "generate_pie_chart" tool with clean structured data.

Example:
User: "make pie chart of apples 10, oranges 20"
Call: generate_pie_chart(labels:["apples","oranges"], values:[10,20])

Otherwise, answer normally.
`,
    tools: [getWeather, generatePieChart],
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
        // Extract content as string
        let content = "";
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
        // Ensure content is always a string
        if (typeof content !== "string") {
            content = String(content || "");
        }
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
