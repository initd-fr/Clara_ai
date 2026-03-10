import { EventEmitter } from "events";

// Interface pour les événements de progression
export interface ProgressEvent {
  userId: string;
  taskId: string;
  type: "create" | "update";
  step: string;
  progress: number;
  done: boolean;
  error?: string;
}

// EventEmitter global partagé entre le backend et le serveur WebSocket
export const progressEmitter = new EventEmitter();

// Fonction pour émettre un événement de progression
export const emitProgress = (event: ProgressEvent) => {
  progressEmitter.emit("progress", event);
};
