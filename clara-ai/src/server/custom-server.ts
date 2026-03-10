import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import type { ProgressEvent } from "~/server/shared/progressBridge";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Créer l'app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Fichier de progression
const PROGRESS_FILE = join(process.cwd(), ".progress-events.json");

// Variables pour le polling
let lastEventTimestamp = 0;
let lastFileSize = 0;

app.prepare().then(() => {
  // Créer le serveur HTTP
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Créer le serveur WebSocket sur le même serveur HTTP
  const wss = new WebSocketServer({ server });

  // Fonction pour diffuser un événement à tous les clients
  const broadcastProgress = (event: ProgressEvent) => {
    console.log(
      `📡 Broadcasting progress to ${wss.clients.size} clients:`,
      event,
    );

    // Diffuser à tous les clients connectés
    wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: "progress",
            data: event,
          }),
        );
      }
    });
  };

  // Polling du fichier de progression
  setInterval(() => {
    try {
      if (!existsSync(PROGRESS_FILE)) return;

      const stats = statSync(PROGRESS_FILE);
      if (stats.size === lastFileSize) return; // Pas de changement

      lastFileSize = stats.size;
      const events = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));

      // Traiter les nouveaux événements
      events.forEach((event: ProgressEvent & { timestamp: number }) => {
        if (event.timestamp > lastEventTimestamp) {
          lastEventTimestamp = event.timestamp;
          broadcastProgress(event);
        }
      });
    } catch (error) {}
  }, 100); // Vérifier toutes les 100ms

  wss.on("connection", (ws) => {
    // Envoyer un message de test
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket connected successfully",
      }),
    );

    ws.once("close", () => {});
  });

  // Démarrer le serveur
  server.listen(port, (err?: Error) => {
    if (err) throw err;
  });
});
