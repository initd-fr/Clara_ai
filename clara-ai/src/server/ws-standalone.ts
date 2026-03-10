import { WebSocketServer } from "ws";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import type { ProgressEvent } from "~/server/shared/progressBridge";

// En production: utiliser le port 3002 (3001 réservé à l'API Python)
const port =
  Number(process.env.WS_PORT) ||
  (process.env.NODE_ENV === "production" ? 3002 : 3001);
const wss = new WebSocketServer({ port });

wss.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Port ${port} déjà utilisé. Libérez-le avec:\n   pnpm dev:kill\n   puis relancez: pnpm dev\n`,
    );
    process.exit(1);
  }
  throw err;
});
const PROGRESS_FILE = join(process.cwd(), ".progress-events.json");

// Variables pour le polling
let lastEventTimestamp = 0;
let lastFileSize = 0;

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

export { wss };
