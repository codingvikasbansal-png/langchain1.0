"use client";

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessageContext,
} from "@assistant-ui/react";
import { useEdgeRuntime } from "@assistant-ui/react";

/**
 * Message component that renders individual chat messages
 * Styles differently based on whether it's from user or assistant
 */
function ChatMessage() {
  const messageContext = useMessageContext();
  const messageState = messageContext.useMessage();
  const isUser = messageState.message.role === "user";

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-3 rounded-lg max-w-[75%] ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 border border-gray-200"
        }`}
      >
        <MessagePrimitive.Content />
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
        <div className="flex-1 overflow-hidden">
          <ThreadPrimitive.Root>
            <ThreadPrimitive.Viewport className="h-full overflow-y-auto px-6 py-8">
              <div className="max-w-4xl mx-auto">
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
