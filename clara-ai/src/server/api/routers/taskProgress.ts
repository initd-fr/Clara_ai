import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";
import {
  progressEmitter,
  type ProgressEvent,
} from "~/server/shared/progressBridge";

export const taskProgressRouter = createTRPCRouter({
  // Subscription pour suivre la progression des tâches
  subscribe: publicProcedure
    .input(z.object({ userId: z.string() }))
    .subscription(({ input }) => {
      console.log("📡 New subscription for user:", input.userId);

      return observable<ProgressEvent>((emit) => {
        const handleProgress = (event: ProgressEvent) => {
          // Ne émettre que les événements pour cet utilisateur
          if (event.userId === input.userId) {
            emit.next(event);
          }
        };

        // Écouter les événements de progression
        progressEmitter.on("progress", handleProgress);

        // Cleanup function
        return () => {
          console.log("🔌 Cleaning up subscription for user:", input.userId);
          progressEmitter.off("progress", handleProgress);
        };
      });
    }),
});
