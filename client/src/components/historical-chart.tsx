import type { WebsiteWithStatus } from "@shared/schema";

interface HistoricalChartProps {
  websites: WebsiteWithStatus[];
}

export function HistoricalChart({ websites }: HistoricalChartProps) {
  // Generate mock response time data for the last 12 hours
  const generateResponseTimeData = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const time = new Date();
      time.setHours(time.getHours() - i);
      
      // Calculate average response time from all websites
      const avgResponseTime = websites.length > 0 
        ? websites.reduce((acc, w) => acc + (w.lastCheck?.responseTime || 0), 0) / websites.length
        : 0;
      
      // Add some variation
      const variation = (Math.random() - 0.5) * 100;
      const responseTime = Math.max(50, avgResponseTime + variation);
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        responseTime,
      });
    }
    return data;
  };

  const responseTimeData = generateResponseTimeData();
  const maxResponseTime = Math.max(...responseTimeData.map(d => d.responseTime));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Response Time Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Average Response Time (12h)
        </h4>
        <div className="h-40 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-end justify-between p-4 space-x-1">
          {responseTimeData.map((data, index) => (
            <div
              key={index}
              className="bg-primary rounded-t flex-1 max-w-6"
              style={{ 
                height: `${(data.responseTime / maxResponseTime) * 100}%`,
                minHeight: '8px'
              }}
              title={`${data.responseTime.toFixed(0)}ms - ${data.time}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{responseTimeData[0]?.time}</span>
          <span>{responseTimeData[Math.floor(responseTimeData.length / 2)]?.time}</span>
          <span>{responseTimeData[responseTimeData.length - 1]?.time}</span>
        </div>
      </div>

      {/* Service Availability */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Service Availability
        </h4>
        <div className="space-y-4">
          {websites.slice(0, 4).map((website) => (
            <div key={website.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-32">
                {website.name}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (website.uptime || 0) >= 95 ? 'bg-green-500' :
                      (website.uptime || 0) >= 80 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${website.uptime || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                  {website.uptime ? `${website.uptime.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          ))}
          
          {websites.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
