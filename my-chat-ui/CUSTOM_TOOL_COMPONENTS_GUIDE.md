# Custom Tool Components Guide

## 📋 How Tool Calls Work in the Frontend

### Current Flow

1. **Backend sends tool calls**: When the agent calls a tool, the backend sends:
   - An `AIMessage` with `tool_calls` array containing tool call information
   - `ToolMessage`(s) with tool results
   - Final `AIMessage` with the response

2. **Frontend renders tool calls**: The `ToolCalls` component in `tool-calls.tsx` displays:
   - Tool name
   - Tool ID
   - Tool arguments in a table format

3. **Frontend renders tool results**: The `ToolResult` component displays:
   - Tool result content (parsed JSON or plain text)
   - Expandable/collapsible view for large results

### Where Components Are Located

```
my-chat-ui/apps/web/src/components/thread/messages/
├── ai.tsx                    # Main AI message component
├── tool-calls.tsx            # Tool calls and results renderer
├── custom-tool-renderers.tsx # Custom tool component router
└── tool-renderers/
    ├── pie-chart.tsx         # Pie chart custom renderer
    ├── table.tsx             # Table custom renderer
    └── weather.tsx           # Weather custom renderer
```

## 🎨 How to Add a Custom Component for a New Tool

### Step 1: Create Your Tool in the Backend

In `simple-langgraph-server/src/server.ts`, add your tool:

```typescript
const myCustomTool = tool(
  async ({ param1, param2 }) => {
    return {
      type: "my_custom_tool",
      data: { param1, param2 },
      message: "Custom tool executed successfully"
    };
  },
  {
    name: "my_custom_tool",
    description: "Description of what your tool does",
    schema: z.object({
      param1: z.string().describe("Parameter 1 description"),
      param2: z.number().describe("Parameter 2 description"),
    }),
  }
);

// Add to agent tools array
const agent = createAgent({
  model,
  tools: [getWeather, generatePieChart, generateTable, myCustomTool],
  // ...
});
```

### Step 2: Create Custom Renderer Component

Create a new file: `my-chat-ui/apps/web/src/components/thread/messages/tool-renderers/my-custom-tool.tsx`

```typescript
interface MyCustomToolProps {
  data: {
    param1: string;
    param2: number;
  };
  message?: string;
}

export function MyCustomToolRenderer({ data, message }: MyCustomToolProps) {
  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
        <h3 className="font-medium text-gray-900">🎨 My Custom Tool</h3>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
      </div>
      <div className="p-4">
        <div className="space-y-2">
          <p><strong>Param 1:</strong> {data.param1}</p>
          <p><strong>Param 2:</strong> {data.param2}</p>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Register in Custom Tool Renderer Router

Update `custom-tool-renderers.tsx`:

```typescript
import { MyCustomToolRenderer } from "./tool-renderers/my-custom-tool";

// Inside CustomToolRenderer function, add:
if (toolName === "my_custom_tool" || toolType === "my_custom_tool") {
  if (parsedContent.data) {
    return (
      <MyCustomToolRenderer
        data={parsedContent.data}
        message={parsedContent.message}
      />
    );
  }
}
```

### Step 4: Update Tool Result Component

Update `tool-calls.tsx` to recognize your tool:

```typescript
const hasCustomRenderer = 
  toolName === "generate_pie_chart" || toolType === "pie_chart" ||
  toolName === "generate_table" || toolType === "table" ||
  toolName === "get_weather" || toolType === "weather" ||
  toolName === "my_custom_tool" || toolType === "my_custom_tool"; // Add your tool
```

## 🔍 How Tool Calls Are Detected

The system checks for custom renderers by:

1. **Tool Name**: Checks `message.name` (from ToolMessage)
2. **Tool Type**: Checks `parsedContent.type` (from tool result JSON)

Both are converted to lowercase for matching.

## 📊 Example: Pie Chart Tool

**Backend Tool** (`server.ts`):
```typescript
const generatePieChart = tool(
  async ({ labels, values }) => {
    return {
      type: "pie_chart",  // ← This is checked in frontend
      labels,
      values,
      message: "Pie chart data generated successfully.",
    };
  },
  {
    name: "generate_pie_chart",  // ← This is also checked
    // ...
  }
);
```

**Frontend Renderer** (`pie-chart.tsx`):
- Detects `toolName === "generate_pie_chart"` OR `toolType === "pie_chart"`
- Renders interactive pie chart using recharts library

## 🎯 Key Points

1. **Tool Result Format**: Your tool should return JSON with a `type` field matching your tool name
2. **Component Location**: Custom renderers go in `tool-renderers/` folder
3. **Registration**: Must register in both `custom-tool-renderers.tsx` and `tool-calls.tsx`
4. **Fallback**: If no custom renderer matches, the default `ToolResult` component is used

## 🚀 Testing Your Custom Component

1. **Start the backend**: `cd simple-langgraph-server && npm start`
2. **Start the frontend**: `cd my-chat-ui && npm run dev`
3. **Test in chat**: Ask the agent to use your tool
4. **Check console**: Look for tool call logs in backend
5. **Verify rendering**: Your custom component should appear instead of default table

## 📝 Notes

- Custom components receive the **parsed tool result** as props
- The tool result is automatically parsed from JSON if it's a string
- You can access `message.name` and `message.tool_call_id` if needed
- Components should be self-contained and handle their own styling




