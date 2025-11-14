import { streamText } from 'ai';

/**
 * Helper function to extract text content from various message content formats
 */
function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('');
  }

  if (content && typeof content === 'object' && 'text' in content && typeof content.text === 'string') {
    return content.text;
  }

  return '';
}

/**
 * API Route handler for chat messages
 * Forwards requests to the LangChain backend and returns streaming responses
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { messages } = body;
    
    // Transform messages to the format backend expects
    const transformedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: extractText(msg.content)
    }));
    
    console.log('Transformed messages:', JSON.stringify(transformedMessages, null, 2));
    
    // Call your LangChain backend
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: transformedMessages }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error response:', errorData);
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response:', JSON.stringify(data, null, 2));
    const assistantText = extractText(data.content);
    
    // Create a data stream with the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the complete message as data protocol chunks
        controller.enqueue(encoder.encode(`0:${JSON.stringify(assistantText)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    );
  }
}