// ============================================================================
// BigDeck - Network Server
// REST API and WebSocket server for remote control
// ============================================================================

import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import type { DeviceManager } from "../device/DeviceManager";
import type { ProfileManager } from "../profiles/ProfileManager";
import type { ActionEngine } from "../actions/ActionEngine";
import type { Logger } from "../utils/Logger";
import type {
  Action,
  APIResponse,
  Profile,
  DeviceInfo,
} from "../../shared/types";

interface AuthenticatedRequest extends Request {
  authenticated?: boolean;
}

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  authenticated: boolean;
}

export class NetworkServer {
  private app: Express;
  private server: HTTPServer | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private authToken: string | null = null;
  private logger: Logger;
  private deviceManager: DeviceManager;
  private profileManager: ProfileManager;
  private actionEngine: ActionEngine;

  constructor(
    logger: Logger,
    deviceManager: DeviceManager,
    profileManager: ProfileManager,
    actionEngine: ActionEngine,
  ) {
    this.logger = logger;
    this.deviceManager = deviceManager;
    this.profileManager = profileManager;
    this.actionEngine = actionEngine;

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Start the network server
   */
  async start(port: number, authToken?: string): Promise<void> {
    this.authToken = authToken || null;

    this.server = createServer(this.app);
    this.setupWebSocket();

    return new Promise((resolve, reject) => {
      this.server!.listen(port, () => {
        this.logger.info(`Network server started on port ${port}`);
        resolve();
      }).on("error", reject);
    });
  }

  /**
   * Stop the network server
   */
  async stop(): Promise<void> {
    // Close all WebSocket connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info("Network server stopped");
          resolve();
        });
      });
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());

    // CORS headers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    // Authentication middleware
    this.app.use(
      (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!this.authToken) {
          req.authenticated = true;
          return next();
        }

        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token === this.authToken) {
          req.authenticated = true;
          next();
        } else {
          res
            .status(401)
            .json({ success: false, error: "Unauthorized" } as APIResponse);
        }
      },
    );
  }

  /**
   * Setup REST API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get("/api/health", (req: Request, res: Response) => {
      res.json({
        success: true,
        data: { status: "ok", version: "1.0.0" },
      } as APIResponse);
    });

    // === Device Routes ===

    this.app.get("/api/devices", (req: Request, res: Response) => {
      const devices = this.deviceManager.getDevices();
      res.json({ success: true, data: devices } as APIResponse<DeviceInfo[]>);
    });

    this.app.post(
      "/api/devices/:deviceId/brightness",
      async (req: Request, res: Response) => {
        try {
          const { deviceId } = req.params;
          const { brightness } = req.body;
          await this.deviceManager.setBrightness(deviceId, brightness);
          res.json({ success: true } as APIResponse);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    this.app.post(
      "/api/devices/:deviceId/keys/:keyIndex/press",
      async (req: Request, res: Response) => {
        try {
          const { keyIndex } = req.params;
          const activeProfile = this.profileManager.getActiveProfile();

          if (activeProfile) {
            const page = activeProfile.pages[activeProfile.activePage];
            const keyConfig = page?.keys.find(
              (k) => k.keyIndex === parseInt(keyIndex, 10),
            );

            if (keyConfig?.action) {
              await this.actionEngine.executeAction(keyConfig.action);
            }
          }

          res.json({ success: true } as APIResponse);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    // === Profile Routes ===

    this.app.get("/api/profiles", (req: Request, res: Response) => {
      const profiles = this.profileManager.getProfiles();
      res.json({ success: true, data: profiles } as APIResponse<Profile[]>);
    });

    this.app.get("/api/profiles/active", (req: Request, res: Response) => {
      const profile = this.profileManager.getActiveProfile();
      res.json({ success: true, data: profile } as APIResponse<Profile | null>);
    });

    this.app.post(
      "/api/profiles/:profileId/activate",
      async (req: Request, res: Response) => {
        try {
          const { profileId } = req.params;
          const profile = this.profileManager.activateProfile(profileId);
          res.json({ success: true, data: profile } as APIResponse<Profile>);

          // Notify WebSocket clients
          this.broadcast("profile:activated", profile);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    this.app.post(
      "/api/profiles/:profileId/page/:pageIndex",
      async (req: Request, res: Response) => {
        try {
          const { profileId, pageIndex } = req.params;
          const profile = this.profileManager.setActivePage(
            profileId,
            parseInt(pageIndex, 10),
          );
          res.json({ success: true, data: profile } as APIResponse<Profile>);

          // Notify WebSocket clients
          this.broadcast("profile:page-changed", {
            profileId,
            pageIndex: parseInt(pageIndex, 10),
          });
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    // === Action Routes ===

    this.app.post(
      "/api/actions/execute",
      async (req: Request, res: Response) => {
        try {
          const action = req.body as Action;
          await this.actionEngine.executeAction(action);
          res.json({ success: true } as APIResponse);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    // === Shortcut Routes (simplified action execution) ===

    this.app.post("/api/shortcut/key", async (req: Request, res: Response) => {
      try {
        const { keys, modifiers } = req.body;

        // Input validation
        const validModifiers = ["ctrl", "alt", "shift", "super"];
        const validKeyPattern = /^[a-zA-Z0-9]$/;
        const validSpecialKeys = [
          "Return",
          "Delete",
          "BackSpace",
          "Tab",
          "Escape",
          "space",
          "Up",
          "Down",
          "Left",
          "Right",
          "Home",
          "End",
          "Page_Up",
          "Page_Down",
          "Insert",
          "F1",
          "F2",
          "F3",
          "F4",
          "F5",
          "F6",
          "F7",
          "F8",
          "F9",
          "F10",
          "F11",
          "F12",
        ];

        // Validate modifiers
        if (modifiers && Array.isArray(modifiers)) {
          for (const mod of modifiers) {
            if (
              typeof mod !== "string" ||
              !validModifiers.includes(mod.toLowerCase())
            ) {
              return res.status(400).json({
                success: false,
                error: `Invalid modifier: ${mod}. Valid: ${validModifiers.join(", ")}`,
              } as APIResponse);
            }
          }
        }

        // Validate keys
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Keys must be a non-empty array",
          } as APIResponse);
        }

        for (const key of keys) {
          if (typeof key !== "string") {
            return res.status(400).json({
              success: false,
              error: "Keys must be strings",
            } as APIResponse);
          }
          if (!validKeyPattern.test(key) && !validSpecialKeys.includes(key)) {
            return res.status(400).json({
              success: false,
              error: `Invalid key: ${key}`,
            } as APIResponse);
          }
        }

        await this.actionEngine.executeAction({
          type: "keyboard-shortcut",
          id: "api-shortcut",
          name: "API Shortcut",
          keys,
          modifiers: modifiers || [],
        });
        res.json({ success: true } as APIResponse);
      } catch (error) {
        res
          .status(400)
          .json({ success: false, error: String(error) } as APIResponse);
      }
    });

    this.app.post(
      "/api/shortcut/launch",
      async (req: Request, res: Response) => {
        try {
          const { command, args } = req.body;
          await this.actionEngine.executeAction({
            type: "launch-app",
            id: "api-launch",
            name: "API Launch",
            command,
            args,
          });
          res.json({ success: true } as APIResponse);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );

    this.app.post(
      "/api/shortcut/media/:command",
      async (req: Request, res: Response) => {
        try {
          const { command } = req.params;
          const validCommands = [
            "play-pause",
            "next",
            "previous",
            "stop",
            "volume-up",
            "volume-down",
            "mute",
          ];

          if (!validCommands.includes(command)) {
            return res
              .status(400)
              .json({
                success: false,
                error: "Invalid media command",
              } as APIResponse);
          }

          await this.actionEngine.executeAction({
            type: "multimedia",
            id: "api-media",
            name: "API Media",
            mediaCommand: command as any,
          });
          res.json({ success: true } as APIResponse);
        } catch (error) {
          res
            .status(400)
            .json({ success: false, error: String(error) } as APIResponse);
        }
      },
    );
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ server: this.server! });

    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        authenticated: !this.authToken, // Auto-auth if no token required
      };

      this.clients.set(clientId, client);
      this.logger.debug(`WebSocket client connected: ${clientId}`);

      ws.on("message", (data: Buffer) => {
        this.handleWebSocketMessage(client, data.toString());
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
        this.logger.debug(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on("error", (error) => {
        this.logger.error(`WebSocket error (${clientId}):`, error);
      });

      // Send welcome message
      this.send(client, "connected", {
        clientId,
        authenticated: client.authenticated,
      });
    });

    // Forward device and profile events to WebSocket clients
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding to WebSocket clients
   */
  private setupEventForwarding(): void {
    this.deviceManager.on("device:connected", (device) => {
      this.broadcast("device:connected", device);
    });

    this.deviceManager.on("device:disconnected", (deviceId) => {
      this.broadcast("device:disconnected", { deviceId });
    });

    this.deviceManager.on("key:down", (data) => {
      this.broadcast("key:down", data);
    });

    this.deviceManager.on("key:up", (data) => {
      this.broadcast("key:up", data);
    });

    this.profileManager.on("profile:activated", (profile) => {
      this.broadcast("profile:activated", profile);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleWebSocketMessage(
    client: WebSocketClient,
    message: string,
  ): void {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case "auth":
          if (this.authToken && payload?.token === this.authToken) {
            client.authenticated = true;
            this.send(client, "auth:success", {});
          } else if (this.authToken) {
            this.send(client, "auth:failed", {});
          }
          break;

        case "subscribe":
          // Client subscribes to specific events
          this.logger.debug(
            `Client ${client.id} subscribed to: ${payload?.events}`,
          );
          break;

        case "action:execute":
          if (client.authenticated) {
            this.actionEngine.executeAction(payload).catch((error) => {
              this.send(client, "error", { message: String(error) });
            });
          }
          break;

        case "profile:activate":
          if (client.authenticated && payload?.profileId) {
            try {
              this.profileManager.activateProfile(payload.profileId);
            } catch (error) {
              this.send(client, "error", { message: String(error) });
            }
          }
          break;
      }
    } catch (error) {
      this.logger.error("WebSocket message parse error:", error);
    }
  }

  /**
   * Send message to a specific client
   */
  private send(client: WebSocketClient, type: string, payload: unknown): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type, payload }));
    }
  }

  /**
   * Broadcast message to all authenticated clients
   */
  private broadcast(type: string, payload: unknown): void {
    for (const client of this.clients.values()) {
      if (client.authenticated) {
        this.send(client, type, payload);
      }
    }
  }

  /**
   * Generate a new auth token
   */
  generateAuthToken(): string {
    this.authToken = uuidv4();
    return this.authToken;
  }

  /**
   * Get current server status
   */
  getStatus(): { running: boolean; port: number | null; connections: number } {
    return {
      running: this.server !== null,
      port: this.server?.address?.()
        ? (this.server.address() as { port: number }).port
        : null,
      connections: this.clients.size,
    };
  }
}
