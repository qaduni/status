import { websites, statusChecks, type Website, type InsertWebsite, type StatusCheck, type InsertStatusCheck, type WebsiteWithStatus } from "@shared/schema";

export interface IStorage {
  // Website operations
  createWebsite(website: InsertWebsite): Promise<Website>;
  getWebsites(): Promise<Website[]>;
  getWebsite(id: number): Promise<Website | undefined>;
  deleteWebsite(id: number): Promise<boolean>;

  // Status check operations
  createStatusCheck(statusCheck: InsertStatusCheck): Promise<StatusCheck>;
  getStatusChecksForWebsite(websiteId: number, limit?: number): Promise<StatusCheck[]>;
  getLatestStatusChecks(): Promise<StatusCheck[]>;

  // Combined operations
  getWebsitesWithStatus(): Promise<WebsiteWithStatus[]>;
}

export class MemStorage implements IStorage {
  private websites: Map<number, Website>;
  private statusChecks: Map<number, StatusCheck>;
  private currentWebsiteId: number;
  private currentStatusCheckId: number;

  constructor() {
    this.websites = new Map();
    this.statusChecks = new Map();
    this.currentWebsiteId = 1;
    this.currentStatusCheckId = 1;

    // Initialize with some default websites for demonstration
    this.initializeDefaultWebsites();
  }

  private async initializeDefaultWebsites() {
    const defaultWebsites = [
      { name: "website", url: "https://qu.edu.iq" },
      { name: "website", url: "https://en.qu.edu.iq" },
      { name: "website", url: "https://staff.qu.edu.iq" },
      { name: "website", url: "https://edu.qu.edu.iq" },
      { name: "website", url: "https://ade.qu.edu.iq" },
      { name: "website", url: "https://art.qu.edu.iq" },
      { name: "website", url: "https://vm.qu.edu.iq" },
      { name: "website", url: "https://med.qu.edu.iq" },
      { name: "website", url: "https://spo.qu.edu.iq" },
      { name: "website", url: "https://sc.qu.edu.iq" },
      { name: "website", url: "https://law.qu.edu.iq" },
      { name: "website", url: "https://eng.qu.edu.iq" },
      { name: "website", url: "https://cm.qu.edu.iq" },
      { name: "website", url: "https://agr.qu.edu.iq" },
      { name: "website", url: "https://eduw.qu.edu.iq" },
      { name: "website", url: "https://ph.qu.edu.iq" },
      { name: "website", url: "https://nurs.qu.edu.iq" },
      { name: "website", url: "https://den.qu.edu.iq" },
      { name: "website", url: "https://arc.qu.edu.iq" },
      { name: "website", url: "https://bt.qu.edu.iq" },
      { name: "website", url: "https://fa.qu.edu.iq" },

      { name: "GitHub", url: "https://github.com" },
      { name: "Google", url: "https://google.com" },
      { name: "Example Service", url: "https://httpstat.us/503" },
      { name: "Slow API Service", url: "https://httpstat.us/200?sleep=3000" },
    ];

    for (const site of defaultWebsites) {
      await this.createWebsite(site);
    }
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const id = this.currentWebsiteId++;
    const website: Website = {
      ...insertWebsite,
      id,
      createdAt: new Date(),
    };
    this.websites.set(id, website);
    return website;
  }

  async getWebsites(): Promise<Website[]> {
    return Array.from(this.websites.values());
  }

  async getWebsite(id: number): Promise<Website | undefined> {
    return this.websites.get(id);
  }

  async deleteWebsite(id: number): Promise<boolean> {
    const deleted = this.websites.delete(id);
    // Also delete related status checks
    const checksToDelete = Array.from(this.statusChecks.entries())
      .filter(([_, check]) => check.websiteId === id)
      .map(([id]) => id);

    checksToDelete.forEach(checkId => this.statusChecks.delete(checkId));
    return deleted;
  }

  async createStatusCheck(insertStatusCheck: InsertStatusCheck): Promise<StatusCheck> {
    const id = this.currentStatusCheckId++;
    const statusCheck: StatusCheck = {
      ...insertStatusCheck,
      id,
      checkedAt: new Date(),
    };
    this.statusChecks.set(id, statusCheck);
    return statusCheck;
  }

  async getStatusChecksForWebsite(websiteId: number, limit = 10): Promise<StatusCheck[]> {
    return Array.from(this.statusChecks.values())
      .filter(check => check.websiteId === websiteId)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, limit);
  }

  async getLatestStatusChecks(): Promise<StatusCheck[]> {
    const latestChecks = new Map<number, StatusCheck>();

    Array.from(this.statusChecks.values())
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .forEach(check => {
        if (!latestChecks.has(check.websiteId)) {
          latestChecks.set(check.websiteId, check);
        }
      });

    return Array.from(latestChecks.values());
  }

  async getWebsitesWithStatus(): Promise<WebsiteWithStatus[]> {
    const websites = await this.getWebsites();
    const latestChecks = await this.getLatestStatusChecks();
    const latestCheckMap = new Map(latestChecks.map(check => [check.websiteId, check]));

    const result: WebsiteWithStatus[] = [];

    for (const website of websites) {
      const lastCheck = latestCheckMap.get(website.id);
      const recentChecks = await this.getStatusChecksForWebsite(website.id, 10);

      // Calculate uptime percentage from recent checks
      let uptime = 0;
      if (recentChecks.length > 0) {
        const onlineChecks = recentChecks.filter(check => check.status === 'online').length;
        uptime = (onlineChecks / recentChecks.length) * 100;
      }

      result.push({
        ...website,
        lastCheck,
        uptime,
        recentChecks: recentChecks.slice(0, 10), // Last 10 checks for history visualization
      });
    }

    return result;
  }
}

export const storage = new MemStorage();
