import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { taskProgressRouter } from "./api/routers/taskProgress";

const wss = new WebSocketServer({ port: 3001 });

// Créer un router simple juste pour les WebSockets
const wsRouter = {
  taskProgress: taskProgressRouter,
};

// Créer un contexte simple pour WebSocket
const createWSContext = () => {
  return {
    headers: new Headers(),
  };
};

applyWSSHandler({
  wss,
  router: wsRouter as any,
  createContext: createWSContext,
});

wss.on("connection", (ws) => {
  console.log(`➕ WebSocket Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖ WebSocket Connection (${wss.clients.size})`);
  });
});

console.log("✅ WebSocket server running on ws://localhost:3001");

export { wss };
