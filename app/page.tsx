"use client";

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessageContext,
} from "@assistant-ui/react";
import { useEdgeRuntime } from "@assistant-ui/react";
import { ImageSlider } from "./components/ImageSlider";

/**
 * Message component that renders individual chat messages
 * Styles differently based on whether it's from user or assistant
 * Handles tool calls to render the ImageSlider component
 */
function ChatMessage() {
  const messageContext = useMessageContext();
  const messageState = messageContext.useMessage();
  const isUser = messageState.message.role === "user";

  // Get message content
  const content = messageState.message.content;
  
  // Check if this is a tool call message (JSON string with toolName)
  let toolCallData = null;
  let isToolCall = false;
  
  console.log('ChatMessage - Full message:', messageState.message);
  console.log('ChatMessage - Role:', messageState.message.role);
  console.log('ChatMessage - Content type:', typeof content);
  console.log('ChatMessage - Content:', content);
  console.log('ChatMessage - Content is Array?:', Array.isArray(content));
  
  if (!isUser) {
    // Try to extract text from content (could be string, array, or object)
    let textContent = '';
    
    if (typeof content === "string") {
      textContent = content;
    } else if (Array.isArray(content)) {
      // Content might be an array of parts
      console.log('Content is array, items:', content);
      textContent = content.map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) return (part as any).text;
        return '';
      }).join('');
    } else if (content && typeof content === 'object' && 'text' in content) {
      textContent = (content as any).text;
    }
    
    console.log('ChatMessage - Extracted text:', textContent);
    
    // Try to parse as JSON tool call
    if (textContent) {
      try {
        const parsed = JSON.parse(textContent);
        console.log('ChatMessage - Parsed:', parsed);
        if (parsed.toolName && parsed.args) {
          toolCallData = parsed;
          isToolCall = true;
          console.log('ChatMessage - Tool call detected!', toolCallData);
        }
      } catch (e) {
        console.log('ChatMessage - Parse error:', e);
        // Not a JSON tool call, regular text
      }
    }
  }

  console.log('ChatMessage - isToolCall:', isToolCall);
  console.log('ChatMessage - Will render:', isToolCall ? 'ImageSlider' : 'Regular message');

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "max-w-[75%]" : "max-w-full w-full"}`}>
        {/* Tool call rendering */}
        {isToolCall && toolCallData && (
          <>
            {console.log('Rendering tool call:', toolCallData.toolName)}
            {toolCallData.toolName === "createSlider" && 
             toolCallData.args?.topic && 
             toolCallData.args?.count ? (
              <>
                {console.log('Rendering ImageSlider with:', {
                  topic: toolCallData.args.topic,
                  count: toolCallData.args.count,
                  imageUrls: toolCallData.args.imageUrls
                })}
                <ImageSlider
                  topic={toolCallData.args.topic}
                  count={toolCallData.args.count}
                  imageUrls={toolCallData.args.imageUrls}
                />
              </>
            ) : (
              <div className="px-4 py-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800">Tool call data incomplete</p>
                <pre className="text-xs mt-2">{JSON.stringify(toolCallData, null, 2)}</pre>
              </div>
            )}
          </>
        )}

        {/* Regular text content */}
        {!isToolCall && (
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900 border border-gray-200"
            }`}
          >
            <MessagePrimitive.Content />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Chat Application Component
 * Uses Assistant-ui for UI primitives and Edge runtime for backend communication
 */
export default function Home() {
  // Initialize edge runtime with the API route that proxies to backend
  const runtime = useEdgeRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header Section */}
        <header className="bg-white shadow-sm px-6 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">
              Simple Chat Bot
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Powered by LangChain Backend
            </p>
          </div>
        </header>

        {/* Chat Messages Section */}
        <div className="flex-1 overflow-hidden relative">
          <ThreadPrimitive.Root className="h-full">
            <ThreadPrimitive.Viewport className="h-full overflow-y-scroll">
              <div className="px-6 py-8">
                <div className="max-w-4xl mx-auto space-y-4">
                  <ThreadPrimitive.Messages
                    components={{ Message: ChatMessage }}
                  />

                  {/* Empty state when no messages */}
                  <ThreadPrimitive.Empty>
                    <div className="text-center text-gray-500 mt-20">
                      <p className="text-lg">👋 Start a conversation</p>
                      <p className="text-sm mt-2">
                        Type a message below to begin
                      </p>
                    </div>
                  </ThreadPrimitive.Empty>
                </div>
              </div>
            </ThreadPrimitive.Viewport>
          </ThreadPrimitive.Root>
        </div>

        {/* Input Section */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <ComposerPrimitive.Root>
              <div className="flex gap-3 items-end">
                <ComposerPrimitive.Input
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[200px]"
                  placeholder="Type your message here..."
                  rows={1}
                />
                <ComposerPrimitive.Send className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors font-medium">
                  Send
                </ComposerPrimitive.Send>
              </div>
            </ComposerPrimitive.Root>
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
