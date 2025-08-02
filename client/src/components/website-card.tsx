import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WebsiteWithStatus } from "@shared/schema";

interface WebsiteCardProps {
  website: WebsiteWithStatus;
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/websites/${website.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Website removed",
        description: `${website.name} has been removed from monitoring.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove website from monitoring.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'slow':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'slow':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Slow</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return "N/A";
    if (responseTime >= 10000) return "Timeout";
    return `${responseTime}ms`;
  };

  const formatLastCheck = (checkedAt?: Date | string) => {
    if (!checkedAt) return "Never";
    
    const date = new Date(checkedAt);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes === 0) return "Just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} mins ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const renderUptimeHistory = () => {
    const checks = website.recentChecks || [];
    if (checks.length === 0) {
      return (
        <div className="flex space-x-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-2 h-8 bg-gray-200 dark:bg-gray-600 rounded-sm" />
          ))}
        </div>
      );
    }

    // Pad with gray bars if we have fewer than 10 checks
    const paddedChecks = [...checks];
    while (paddedChecks.length < 10) {
      paddedChecks.push({ status: 'unknown' } as any);
    }

    return (
      <div className="flex space-x-1">
        {paddedChecks.slice(0, 10).reverse().map((check, i) => (
          <div
            key={i}
            className={`w-2 h-8 rounded-sm ${
              check.status === 'online' ? 'bg-green-500' :
              check.status === 'slow' ? 'bg-yellow-500' :
              check.status === 'offline' ? 'bg-red-500' :
              'bg-gray-200 dark:bg-gray-600'
            }`}
            title={check.status === 'unknown' ? 'No data' : `${check.status} - ${formatResponseTime(check.responseTime)}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className={`${
      website.lastCheck?.status === 'offline' ? 'border-red-200 dark:border-red-800' :
      website.lastCheck?.status === 'slow' ? 'border-yellow-200 dark:border-yellow-800' :
      'border-gray-200 dark:border-gray-700'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(website.lastCheck?.status)} ${
              website.lastCheck?.status === 'online' ? 'animate-pulse' : ''
            }`} />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {website.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(website.url, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {website.url}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              {getStatusBadge(website.lastCheck?.status)}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatResponseTime(website.lastCheck?.responseTime)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status Code</p>
              <p className={`text-sm font-mono ${
                website.lastCheck?.statusCode && website.lastCheck.statusCode >= 200 && website.lastCheck.statusCode < 300
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {website.lastCheck?.statusCode || 'N/A'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Check</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatLastCheck(website.lastCheck?.checkedAt)}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Uptime History */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Uptime: {website.uptime ? `${website.uptime.toFixed(1)}%` : 'N/A'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last 10 checks
            </span>
          </div>
          {renderUptimeHistory()}
        </div>
      </CardContent>
    </Card>
  );
}
