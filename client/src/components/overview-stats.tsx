import { Globe, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WebsiteWithStatus } from "@shared/schema";

interface OverviewStatsProps {
  websites: WebsiteWithStatus[];
}

export function OverviewStats({ websites }: OverviewStatsProps) {
  const totalServices = websites.length;
  const onlineServices = websites.filter(w => w.lastCheck?.status === 'online').length;
  const offlineServices = websites.filter(w => w.lastCheck?.status === 'offline').length;
  
  const avgUptime = websites.length > 0 
    ? websites.reduce((acc, w) => acc + (w.uptime || 0), 0) / websites.length 
    : 0;

  const stats = [
    {
      title: "Total Services",
      value: totalServices.toString(),
      icon: Globe,
      color: "blue",
    },
    {
      title: "Online Services", 
      value: onlineServices.toString(),
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Offline Services",
      value: offlineServices.toString(),
      icon: XCircle,
      color: "red",
    },
    {
      title: "Avg. Uptime",
      value: `${avgUptime.toFixed(1)}%`,
      icon: TrendingUp,
      color: "purple",
    },
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900";
      case "green":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900";
      case "red":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
      case "purple":
        return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900";
    }
  };

  const getValueColor = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-600 dark:text-green-400";
      case "red":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-900 dark:text-gray-100";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${getValueColor(stat.color)}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColor(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
