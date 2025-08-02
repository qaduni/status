import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertStatusCheckSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all websites with their status
  app.get("/api/websites", async (req, res) => {
    try {
      const websites = await storage.getWebsitesWithStatus();
      res.json(websites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Add a new website
  app.post("/api/websites", async (req, res) => {
    try {
      const websiteData = insertWebsiteSchema.parse(req.body);
      const website = await storage.createWebsite(websiteData);
      res.status(201).json(website);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid website data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create website" });
      }
    }
  });

  // Delete a website
  app.delete("/api/websites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWebsite(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Website not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // Check status of a specific website
  app.post("/api/websites/:id/check", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const website = await storage.getWebsite(websiteId);

      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      const statusCheck = await checkWebsiteStatus(website.url, websiteId);
      res.json(statusCheck);
    } catch (error) {
      res.status(500).json({ message: "Failed to check website status" });
    }
  });

  // Check status of all websites
  app.post("/api/websites/check-all", async (req, res) => {
    try {
      const websites = await storage.getWebsites();
      const statusChecks = await Promise.all(
        websites.map(website => checkWebsiteStatus(website.url, website.id))
      );
      res.json(statusChecks);
    } catch (error) {
      res.status(500).json({ message: "Failed to check all websites" });
    }
  });

  // Get status history for a website
  app.get("/api/websites/:id/history", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 24;
      const history = await storage.getStatusChecksForWebsite(websiteId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch status history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Function to check website status
async function checkWebsiteStatus(url: string, websiteId: number) {
  const startTime = Date.now();
  let status = 'offline';
  let statusCode: number | null = null;
  let responseTime = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Status-Monitor/1.0'
      }
    });

    clearTimeout(timeoutId);
    responseTime = Date.now() - startTime;
    statusCode = response.status;

    if (response.ok) {
      status = responseTime > 3000 ? 'slow' : 'online';
    } else {
      status = 'offline';
    }
  } catch (error) {
    responseTime = Date.now() - startTime;
    status = 'offline';

    // Try to determine if it's a timeout vs other error
    if (error instanceof Error && error.name === 'AbortError') {
      responseTime = 10000; // Timeout occurred
    }
  }

  const statusCheck = await storage.createStatusCheck({
    websiteId,
    status,
    statusCode,
    responseTime,
  });

  return statusCheck;
}
