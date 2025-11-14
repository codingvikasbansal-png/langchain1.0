import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Load environment variables from .env file in backend directory
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - Allow requests from any origin
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Initialize LangChain ChatOpenAI
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPENAI_API_KEY,
  streaming: true,
  temperature: 0.7,
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg) => {
      const content = msg.content || (msg.parts && msg.parts[0]?.text) || '';
      
      if (msg.role === 'user') {
        return new HumanMessage(content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(content);
      }
      return null;
    }).filter(Boolean);

    // Simple JSON response for assistant-ui
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get complete response from LangChain (no streaming)
    const response = await model.invoke(langchainMessages);
    
    // Send simple JSON response that assistant-ui can handle
    res.json({
      role: 'assistant',
      content: response.content
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while processing your request' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LangChain backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 LangChain backend server running on http://localhost:${PORT}`);
});

