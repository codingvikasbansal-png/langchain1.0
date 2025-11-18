/**
 * API Route handler for chat messages
 * Simply passes through the backend streaming response to the frontend
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Frontend → API Route: Received request');
    
    const { messages } = body;
    
    // Forward directly to backend
    const backendResponse = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend error:', errorData);
      throw new Error(`Backend responded with ${backendResponse.status}`);
    }

    // Backend already sends the correct streaming format
    // Just pass it through with the right headers
    return new Response(backendResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
