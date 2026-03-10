import { EventEmitter } from "events";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

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

// EventEmitter global partagé
export const progressEmitter = new EventEmitter();

// Chemin vers le fichier de communication
const PROGRESS_FILE = join(process.cwd(), ".progress-events.json");

// Fonction pour émettre un événement de progression
export const emitProgress = (event: ProgressEvent) => {
  // Émettre via EventEmitter (pour les processus locaux)
  progressEmitter.emit("progress", event);

  // Écrire dans le fichier (pour la communication inter-processus)
  try {
    const events = existsSync(PROGRESS_FILE)
      ? JSON.parse(readFileSync(PROGRESS_FILE, "utf8"))
      : [];

    events.push({
      ...event,
      timestamp: Date.now(),
    });

    // Garder seulement les 10 derniers événements
    if (events.length > 10) {
      events.splice(0, events.length - 10);
    }

    writeFileSync(PROGRESS_FILE, JSON.stringify(events, null, 2));
  } catch (error) {}
};

// Fonction pour lire les événements depuis le fichier
export const readProgressEvents = (): ProgressEvent[] => {
  try {
    if (!existsSync(PROGRESS_FILE)) return [];
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  } catch (error) {
    return [];
  }
};
