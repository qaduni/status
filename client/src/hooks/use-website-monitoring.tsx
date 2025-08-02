import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useWebsiteMonitoring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/websites/check-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Status check completed",
        description: "All websites have been checked for availability.",
      });
    },
    onError: () => {
      toast({
        title: "Check failed",
        description: "Failed to check website status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkSingleMutation = useMutation({
    mutationFn: (websiteId: number) => 
      apiRequest("POST", `/api/websites/${websiteId}/check`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
    },
    onError: () => {
      toast({
        title: "Check failed",
        description: "Failed to check website status.",
        variant: "destructive",
      });
    },
  });

  return {
    checkAllWebsites: () => checkAllMutation.mutate(),
    checkSingleWebsite: (websiteId: number) => checkSingleMutation.mutate(websiteId),
    isChecking: checkAllMutation.isPending || checkSingleMutation.isPending,
  };
}
