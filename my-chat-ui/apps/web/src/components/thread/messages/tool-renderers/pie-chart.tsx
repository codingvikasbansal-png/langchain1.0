import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import React from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

interface PieChartRendererProps {
  labels: string[];
  values: number[];
  message?: string;
}

export function PieChartRenderer({ labels, values, message }: PieChartRendererProps) {
  console.log("🎯 [PieChartRenderer] Component RENDERED with:", { labels, values, message });
  // Log mount/unmount to help diagnose transient renders
  React.useEffect(() => {
    console.log("🎯 [PieChartRenderer] mounted");
    return () => console.log("🎯 [PieChartRenderer] unmounted");
  }, []);
  
  // Transform data for recharts
  const data = labels.map((label, index) => ({
    name: label,
    value: values[index] || 0,
  }));

  console.log("🎯 [PieChartRenderer] Transformed data:", data);

  // Ensure we have valid data
  if (!data || data.length === 0) {
    console.warn("🎯 [PieChartRenderer] No data available");
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">📊 Pie Chart</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Match the exact structure of TableRenderer for consistency
  return (
    <div
      className="w-full border-2 border-green-500 rounded-lg overflow-hidden bg-white shadow-lg"
      data-testid="pie-chart-renderer"
      style={{ position: "relative", zIndex: 50 }}
    >
      <div className="bg-green-50 px-4 py-2 border-b-2 border-green-500">
        <h3 className="font-medium text-gray-900">📊 Pie Chart</h3>
        <div className="text-xs text-green-700 font-bold mt-1 bg-green-200 px-2 py-1 rounded">
          ✅ PieChartRenderer Component Rendered Successfully - Data: {JSON.stringify(data)}
        </div>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
      </div>
      <div
        className="p-4 bg-gray-50 flex items-center justify-center"
        style={{ width: "100%", height: "400px", minHeight: "400px" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

