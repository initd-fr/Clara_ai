import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const wss = new WebSocketServer({ port: 3001 });

// Créer un contexte adapté pour WebSocket
const createWSContext = async () => {
  return await createTRPCContext({
    headers: new Headers(),
  });
};

applyWSSHandler({
  wss,
  router: appRouter,
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
