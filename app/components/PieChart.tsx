"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PieChartProps {
  labels: string[];
  values: number[];
}

/**
 * Color palette for pie chart slices
 * Professional, accessible colors with good contrast
 */
const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

/**
 * Custom label renderer for pie slices
 * Shows percentage on the slice itself
 */
const renderLabel = (entry: any) => {
  const percent = entry.percent * 100;
  // Only show label if slice is large enough (>5%)
  if (percent < 5) return "";
  return `${percent.toFixed(0)}%`;
};

/**
 * PieChart Component - Production-grade pie chart visualization
 * 
 * Features:
 * - Responsive design that adapts to container
 * - Accessible color palette
 * - Interactive tooltips
 * - Legend with labels
 * - Percentage labels on slices
 * - Handles edge cases (empty data, mismatched arrays)
 * 
 * @param labels - Array of category labels
 * @param values - Array of numeric values (must match labels length)
 */
export function PieChartComponent({ labels, values }: PieChartProps) {
  // Validation: Check for valid data
  if (!labels || !values || !Array.isArray(labels) || !Array.isArray(values)) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg my-4">
        <p className="text-sm font-medium text-red-800">Invalid chart data</p>
        <p className="text-xs text-red-600 mt-1">
          Labels and values must be arrays
        </p>
      </div>
    );
  }

  if (labels.length === 0 || values.length === 0) {
    return (
      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
        <p className="text-sm font-medium text-yellow-800">Empty chart data</p>
        <p className="text-xs text-yellow-600 mt-1">
          No data available to display
        </p>
      </div>
    );
  }

  if (labels.length !== values.length) {
    return (
      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
        <p className="text-sm font-medium text-yellow-800">
          Data mismatch
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Labels ({labels.length}) and values ({values.length}) must have the same length
        </p>
      </div>
    );
  }

  // Transform data into format required by recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    value: values[index],
  }));

  // Calculate total for statistics
  const total = values.reduce((sum, val) => sum + val, 0);

  return (
    <div className="w-full my-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {/* Chart Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Distribution Chart
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total: <span className="font-medium">{total.toLocaleString()}</span>
          </p>
        </div>

        {/* Pie Chart */}
        <div className="w-full" style={{ height: "400px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                formatter={(value: any, name: string) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: "20px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((item.value / total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

