import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Settings } from "lucide-react";
import { WebsiteCard } from "@/components/website-card";
import { AddWebsiteForm } from "@/components/add-website-form";
import { OverviewStats } from "@/components/overview-stats";
import { HistoricalChart } from "@/components/historical-chart";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWebsiteMonitoring } from "@/hooks/use-website-monitoring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WebsiteWithStatus } from "@shared/schema";

export default function Dashboard() {
  const { data: websites = [], isLoading, refetch } = useQuery<WebsiteWithStatus[]>({
    queryKey: ["/api/websites"],
  });

  const { checkAllWebsites, isChecking } = useWebsiteMonitoring();

  // Set up periodic checking every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllWebsites();
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAllWebsites]);

  const handleRefreshAll = () => {
    checkAllWebsites();
    refetch();
  };

  const getLastUpdateTime = () => {
    if (!websites.length) return "Never";

    const lastCheck = websites
      .map(w => w.lastCheck?.checkedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

    if (!lastCheck) return "Never";

    const diff = Date.now() - new Date(lastCheck).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes === 0) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Status Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Website Monitoring Service
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            System Overview
          </h2>
          <OverviewStats websites={websites} />
        </div>

        {/* Add Website Form */}
        <div className="mb-8">
          <AddWebsiteForm />
        </div>

        {/* Website Status List */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monitored Websites
            </h2>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                Last updated: {getLastUpdateTime()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isChecking}
              >
                {isChecking ? "Checking..." : "Refresh All"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {websites.map((website) => (
              <WebsiteCard key={website.id} website={website} />
            ))}

            {websites.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No websites being monitored
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Add your first website above to start monitoring.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Historical Data */}
        {websites.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Historical Performance
            </h3>
            <HistoricalChart websites={websites} />
          </div>
        )}
      </main>
    </div>
  );
}
