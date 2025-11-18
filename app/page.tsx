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
import { DataTable } from "./components/DataTable";
import { PieChartComponent } from "./components/PieChart";

/**
 * Message component that renders individual chat messages
 * Styles differently based on whether it's from user or assistant
 * Handles tool calls to render ImageSlider and DataTable components
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
  
  // Extract text content for both display and tool call detection
   if (!isUser) {
     console.log('═══════════════════════════════════════════════════════');
     console.log('💬 FRONTEND MESSAGE RECEIVED');
     console.log('═══════════════════════════════════════════════════════');
     console.log('Full Message:', JSON.stringify(messageState.message, null, 2));
     console.log('Content Type:', typeof content);
     console.log('Content Value:', content);
     console.log('Is Array?:', Array.isArray(content));
     
     // Extract text from content structure
     let textContent = '';
     
     if (typeof content === "string") {
       textContent = content;
       console.log('✓ Content is string:', textContent);
     } else if (Array.isArray(content)) {
       console.log('✓ Content is array with', content.length, 'items');
       
       // Extract text from each part in the array
       textContent = content
         .map((part, idx) => {
           console.log(`  Part ${idx}:`, part);
           
           if (typeof part === 'string') {
             return part;
           }
           
           if (part && typeof part === 'object') {
             const partObj = part as any;
             
             // Check for 'text' property
             if ('text' in partObj) {
               console.log(`    → Found text property:`, partObj.text);
               
               // Handle nested structure: text.parts[0].text
               if (typeof partObj.text === 'string') {
                 return partObj.text;
               } else if (partObj.text && typeof partObj.text === 'object') {
                 // Nested: text.parts[0].text
                 if (partObj.text.parts && Array.isArray(partObj.text.parts)) {
                   console.log(`    → Text is nested, extracting from parts`);
                   return partObj.text.parts
                     .map((nestedPart: any) => {
                       if (typeof nestedPart === 'string') return nestedPart;
                       if (nestedPart && nestedPart.text && typeof nestedPart.text === 'string') {
                         return nestedPart.text;
                       }
                       return '';
                     })
                     .filter(Boolean)
                     .join('');
                 }
               }
               
               return String(partObj.text);
             }
             
             // Check for type='text' with text property
             if (partObj.type === 'text' && partObj.text) {
               console.log(`    → Found type=text with text:`, partObj.text);
               
               // Handle nested structure
               if (typeof partObj.text === 'string') {
                 return partObj.text;
               } else if (partObj.text && typeof partObj.text === 'object') {
                 if (partObj.text.parts && Array.isArray(partObj.text.parts)) {
                   return partObj.text.parts
                     .map((nestedPart: any) => {
                       if (typeof nestedPart === 'string') return nestedPart;
                       if (nestedPart && nestedPart.text && typeof nestedPart.text === 'string') {
                         return nestedPart.text;
                       }
                       return '';
                     })
                     .filter(Boolean)
                     .join('');
                 }
               }
               
               return String(partObj.text);
             }
             
             console.log(`    → No text found in object, stringifying`);
             return '';
           }
           
           return '';
         })
         .filter(Boolean)
         .join('');
         
       console.log('✓ Extracted text from array:', textContent);
     } else if (content && typeof content === 'object') {
       const obj = content as any;
       if ('text' in obj) {
         textContent = typeof obj.text === 'string' ? obj.text : String(obj.text);
       } else if (obj.type === 'text' && obj.text) {
         textContent = typeof obj.text === 'string' ? obj.text : String(obj.text);
       }
       console.log('✓ Content is object, extracted text:', textContent);
     }
     
     console.log('📝 Final Extracted Text:', textContent);
     console.log('📝 Text length:', textContent.length);
     console.log('📝 First 100 chars:', textContent.substring(0, 100));
     
     // Try to parse as JSON tool call
     if (textContent && typeof textContent === 'string' && textContent.trim().length > 0) {
       try {
         const parsed = JSON.parse(textContent);
         console.log('🔍 Parsed JSON:', parsed);
         if (parsed && typeof parsed === 'object' && parsed.toolName && parsed.args) {
           toolCallData = parsed;
           isToolCall = true;
           console.log('✅ TOOL CALL DETECTED:', parsed.toolName);
           console.log('✅ Tool args:', parsed.args);
         } else {
           console.log('⚠️ JSON parsed but missing toolName or args');
         }
       } catch (e) {
         console.log('ℹ️ Not a tool call, regular text message', e);
       }
     } else {
       console.log('⚠️ No text content to parse');
     }
     
     console.log('═══════════════════════════════════════════════════════\n');
   }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "max-w-[75%]" : "max-w-full w-full"}`}>
        {/* Tool call rendering */}
        {isToolCall && toolCallData && (
          <>
            {console.log('Rendering tool call:', toolCallData.toolName)}
            {/* Render Image Slider */}
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
            ) : null}
            
            {/* Render Data Table */}
            {(toolCallData.toolName === "createTable" || toolCallData.toolName === "generate_table") && 
             toolCallData.args?.columns && 
             toolCallData.args?.rows ? (
              <>
                {console.log('Rendering DataTable with:', {
                  columns: toolCallData.args.columns,
                  rows: toolCallData.args.rows
                })}
                <DataTable
                  columns={toolCallData.args.columns}
                  rows={toolCallData.args.rows}
                />
              </>
            ) : null}
            
            {/* Render Pie Chart */}
            {toolCallData.toolName === "generate_pie_chart" && 
             toolCallData.args?.labels && 
             toolCallData.args?.values ? (
              <>
                {console.log('Rendering PieChart with:', {
                  labels: toolCallData.args.labels,
                  values: toolCallData.args.values
                })}
                <PieChartComponent
                  labels={toolCallData.args.labels}
                  values={toolCallData.args.values}
                />
              </>
            ) : null}
            
            {/* Unknown or incomplete tool call */}
            {toolCallData.toolName !== "createSlider" && 
             toolCallData.toolName !== "createTable" && 
             toolCallData.toolName !== "generate_table" && 
             toolCallData.toolName !== "generate_pie_chart" && (
              <div className="px-4 py-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800">Unknown tool: {toolCallData.toolName}</p>
                <pre className="text-xs mt-2">{JSON.stringify(toolCallData, null, 2)}</pre>
              </div>
            )}
            
            {/* Incomplete tool data */}
            {(toolCallData.toolName === "createSlider" && 
              (!toolCallData.args?.topic || !toolCallData.args?.count)) ||
             ((toolCallData.toolName === "createTable" || toolCallData.toolName === "generate_table") && 
              (!toolCallData.args?.columns || !toolCallData.args?.rows)) ||
             (toolCallData.toolName === "generate_pie_chart" && 
              (!toolCallData.args?.labels || !toolCallData.args?.values)) ? (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  {(toolCallData.toolName === "createTable" || toolCallData.toolName === "generate_table")
                    ? "Table data incomplete"
                    : toolCallData.toolName === "generate_pie_chart"
                    ? "Pie chart data incomplete"
                    : "Tool call data incomplete"}
                </p>
                {(toolCallData.toolName === "createTable" || toolCallData.toolName === "generate_table") && (
                  <div className="text-xs text-yellow-700 mb-2">
                    {!toolCallData.args?.columns && <p>• Missing: columns</p>}
                    {!toolCallData.args?.rows && <p>• Missing: rows</p>}
                    {toolCallData.args?.columns && !toolCallData.args?.rows && (
                      <p className="mt-2">Columns provided: {JSON.stringify(toolCallData.args.columns)}</p>
                    )}
                  </div>
                )}
                {toolCallData.toolName === "generate_pie_chart" && (
                  <div className="text-xs text-yellow-700 mb-2">
                    {!toolCallData.args?.labels && <p>• Missing: labels</p>}
                    {!toolCallData.args?.values && <p>• Missing: values</p>}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="text-xs text-yellow-600 cursor-pointer">Show full data</summary>
                  <pre className="text-xs mt-2 bg-yellow-100 p-2 rounded overflow-auto">
                    {JSON.stringify(toolCallData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : null}
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
          {(() => {
            // Extract text from assistant-ui message structure
            const fullMessage = messageState.message;
            let displayText = '';
            
            // Assistant-ui structure: content[0].text.parts[0].text
            if (fullMessage.content && Array.isArray(fullMessage.content)) {
              for (const contentItem of fullMessage.content) {
                const item = contentItem as any;
                
                // Check if this is a text content item
                if (item.type === 'text') {
                  // Text can be a string or an object with nested parts
                  if (typeof item.text === 'string') {
                    displayText = item.text;
                    break;
                  } else if (item.text && typeof item.text === 'object') {
                    // Text is an object with parts array (nested structure)
                    if (item.text.parts && Array.isArray(item.text.parts)) {
                      displayText = item.text.parts
                        .map((part: any) => {
                          if (typeof part === 'string') return part;
                          if (part && part.text && typeof part.text === 'string') {
                            return part.text;
                          }
                          return '';
                        })
                        .filter(Boolean)
                        .join('');
                      break;
                    }
                  }
                }
              }
            }
            
            // Show loader if message is still loading and no content
            if (!displayText && (messageState.message as any).status?.type === 'in_progress') {
              return (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              );
            }
            
            return <span>{displayText || 'Thinking...'}</span>;
          })()}
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