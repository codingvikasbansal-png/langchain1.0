import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

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

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an AI assistant that can call tools when needed.

You MUST call a tool only in very specific conditions.

## TOOL CALL RULES

Call the "createSlider" tool ONLY when:
- The user explicitly asks for multiple images (e.g., "5 images", "7 photos", "a slider with images", "a carousel", "gallery", "show many pictures")
- AND the user wants them displayed visually (e.g., "show", "display", "in a slider", "in a carousel")

If the user asks for a single image, or just information about an image, DO NOT call the tool.

## WHEN A TOOL CALL IS TRIGGERED

When the user wants multiple images:
1. You MUST provide actual image URLs in the "imageUrls" parameter
2. Find or generate real, working image URLs for the requested topic
3. Provide exactly the number of URLs the user requested
4. Use high-quality, publicly accessible image URLs (e.g., from Unsplash, Pexels, or other image services)
5. Format URLs as: https://source.unsplash.com/800x600/?[topic]&sig=[unique-number]
6. Each URL MUST have a different sig parameter to ensure unique images
7. Example for 3 cat images:
   - https://source.unsplash.com/800x600/?cat&sig=1
   - https://source.unsplash.com/800x600/?cat&sig=2
   - https://source.unsplash.com/800x600/?cat&sig=3

## WHEN NOT TO CALL A TOOL

Do NOT call the tool if:
- User asks for 1 image
- User asks for a description of an image
- User asks for text or explanations
- User wants non-visual output
- User asks general knowledge questions

## IMPORTANT
- ALWAYS provide the "imageUrls" array with actual URLs
- The number of URLs MUST match the "count" parameter
- Each URL must be unique and valid
- Do NOT output text, only call the tool`;

// Define the createSlider tool
const tools = [
  {
    type: 'function',
    function: {
      name: 'createSlider',
      description: 'Creates an image slider/carousel with multiple images. Only call this when the user explicitly requests multiple images to be displayed visually. You MUST provide actual image URLs.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or theme for the images in the slider'
          },
          count: {
            type: 'number',
            description: 'The number of images to display in the slider'
          },
          imageUrls: {
            type: 'array',
            description: 'Array of actual image URLs to display. Must contain exactly "count" number of URLs. Use format: https://source.unsplash.com/800x600/?[topic]&sig=[1,2,3...] to ensure unique images.',
            items: {
              type: 'string',
              description: 'A valid image URL'
            }
          }
        },
        required: ['topic', 'count', 'imageUrls']
      }
    }
  }
];

// Initialize LangChain ChatOpenAI with tool binding
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPENAI_API_KEY,
  streaming: true,
  temperature: 0.7,
}).bind({ tools });

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Convert messages to LangChain format, adding system message at the start
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((msg) => {
        const content = msg.content || (msg.parts && msg.parts[0]?.text) || '';
        
        if (msg.role === 'user') {
          return new HumanMessage(content);
        } else if (msg.role === 'assistant') {
          return new AIMessage(content);
        }
        return null;
      }).filter(Boolean)
    ];

    // Simple JSON response for assistant-ui
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get complete response from LangChain (no streaming)
    const response = await model.invoke(langchainMessages);
    
    console.log('LangChain response:', JSON.stringify(response, null, 2));
    
    // Check if the model wants to call a tool
    if (response.additional_kwargs?.tool_calls && response.additional_kwargs.tool_calls.length > 0) {
      const toolCall = response.additional_kwargs.tool_calls[0];
      
      // Return tool call information
      res.json({
        role: 'assistant',
        content: response.content || '',
        toolCalls: [{
          id: toolCall.id,
          type: 'function',
          function: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          }
        }]
      });
    } else {
      // Regular text response
      res.json({
        role: 'assistant',
        content: response.content
      });
    }
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

