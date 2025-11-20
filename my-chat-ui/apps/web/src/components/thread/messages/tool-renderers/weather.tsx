import { Cloud, Sun, CloudRain, Wind } from "lucide-react";

interface WeatherRendererProps {
  content: string | Record<string, any>;
}

export function WeatherRenderer({ content }: WeatherRendererProps) {
  const weatherText = typeof content === "string" ? content : JSON.stringify(content);

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-sky-50">
      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <h3 className="font-medium text-gray-900">🌤️ Weather Information</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-700 text-lg font-medium">{weatherText}</p>
      </div>
    </div>
  );
}




