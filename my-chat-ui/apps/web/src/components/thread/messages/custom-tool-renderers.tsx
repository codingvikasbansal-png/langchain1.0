import { ToolMessage } from "@langchain/langgraph-sdk";
import { PieChartRenderer } from "./tool-renderers/pie-chart";
import { TableRenderer } from "./tool-renderers/table";
import { WeatherRenderer } from "./tool-renderers/weather";

/**
 * Custom tool renderer component
 * This component detects the tool type from the tool result and renders
 * a custom component if available, otherwise falls back to default rendering
 */
export function CustomToolRenderer({ message }: { message: ToolMessage }) {
  let parsedContent: any;

  // Parse the tool result content
  try {
    if (typeof message.content === "string") {
      // Try to parse as JSON
      try {
        parsedContent = JSON.parse(message.content);
      } catch {
        // Not JSON, use as string
        parsedContent = message.content;
      }
    } else if (typeof message.content === "object" && message.content !== null) {
      // Already an object
      parsedContent = message.content;
    } else {
      parsedContent = message.content;
    }
  } catch {
    parsedContent = message.content;
  }

  // If content is not an object, use default rendering
  if (!parsedContent || typeof parsedContent !== "object") {
    console.warn("❌ [CustomToolRenderer] Content is not an object:", parsedContent, typeof parsedContent);
    return null; // Return null to use default ToolResult component
  }

  // Check tool name or parsed type to determine which custom component to use
  const toolName = message.name?.toLowerCase() || "";
  const toolType = parsedContent.type?.toLowerCase() || "";

  console.log("🔍 [CustomToolRenderer] Tool detection:", {
    toolName,
    toolType,
    parsedContent,
    hasLabels: !!parsedContent.labels,
    hasValues: !!parsedContent.values,
  });

  // Render custom components based on tool type
  if (toolName === "generate_pie_chart" || toolType === "pie_chart") {
    // Match the exact pattern used by table renderer - simple existence check
    const labels = parsedContent.labels;
    const values = parsedContent.values;
    
    console.log("🔍 [CustomToolRenderer] Pie chart detection:", {
      toolName,
      toolType,
      hasLabels: !!labels,
      hasValues: !!values,
      labelsType: typeof labels,
      valuesType: typeof values,
      labelsIsArray: Array.isArray(labels),
      valuesIsArray: Array.isArray(values),
      labels,
      values,
    });
    
    // Check if labels and values exist and are arrays
    if (labels && values && Array.isArray(labels) && Array.isArray(values)) {
      console.log("✅ [CustomToolRenderer] Rendering PieChartRenderer with:", { labels, values });
      return (
        <div className="w-full">
          <PieChartRenderer
            labels={labels}
            values={values}
            message={parsedContent.message}
          />
        </div>
      );
    } else {
      console.warn("❌ [CustomToolRenderer] Missing or invalid labels/values:", { 
        labels, 
        values,
        labelsIsArray: Array.isArray(labels),
        valuesIsArray: Array.isArray(values),
      });
      // Return a debug view to show what we received
      return (
        <div className="border border-red-300 rounded-lg overflow-hidden bg-red-50 p-4">
          <h3 className="font-medium text-red-900 mb-2">⚠️ Pie Chart Debug Info</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ toolName, toolType, labels, values, parsedContent }, null, 2)}
          </pre>
        </div>
      );
    }
  }

  if (toolName === "generate_table" || toolType === "table") {
    if (parsedContent.columns && parsedContent.rows) {
      return (
        <div className="w-full">
          <TableRenderer
            columns={parsedContent.columns}
            rows={parsedContent.rows}
            message={parsedContent.message}
          />
        </div>
      );
    }
  }

  if (toolName === "get_weather" || toolType === "weather") {
    return (
      <div className="w-full">
        <WeatherRenderer content={parsedContent} />
      </div>
    );
  }

  // No custom renderer found, return null to use default
  return null;
}

