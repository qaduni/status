import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertWebsite } from "@shared/schema";

export function AddWebsiteForm() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: InsertWebsite) => 
      apiRequest("POST", "/api/websites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      setName("");
      setUrl("");
      toast({
        title: "Website added",
        description: "The website has been added to monitoring.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add website. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and URL for the website.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({ name: name.trim(), url: url.trim() });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add New Website
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Website Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            disabled={addMutation.isPending}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addMutation.isPending ? "Adding..." : "Add Website"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
