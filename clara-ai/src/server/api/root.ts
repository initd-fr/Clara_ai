// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { bucketsRouter } from "~/server/api/routers/Files/buckets";
import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/Users/user";
import { messagesRouter } from "~/server/api/routers/chat/ModelsPerso/Services/messages";
import { speedCreateRouter } from "~/server/api/routers/Usersmodels/speedCreateRouter";
import { dbBackupRestore } from "~/server/api/routers/Backup/dbBackupRestore";
import { settingsRouter } from "~/server/api/routers/Settings/systemSettings";
import { UserModelsRouter } from "~/server/api/routers/Usersmodels/Usersmodels";
import { availableModelsRouter } from "~/server/api/routers/ProvidersModels/availableModels";
import { adminModelsRouter } from "~/server/api/routers/ProvidersModels/adminModels";
import { openaiRouter } from "./routers/chat/ModelsPerso/Providers/openai";
import { anthropicRouter } from "./routers/chat/ModelsPerso/Providers/anthropic";
import { mistralRouter } from "./routers/chat/ModelsPerso/Providers/mistral";
import { googleRouter } from "./routers/chat/ModelsPerso/Providers/google";
import { providerRouter } from "~/server/api/routers/Providers/provider";
import { toolsRouter } from "~/server/api/routers/chat/ModelsPerso/Services/simplify";
import { logRouter } from "~/server/api/routers/Log/log";
import { taskProgressRouter } from "~/server/api/routers/taskProgress";
import {
  createTRPCRouter,
  createTRPCContext,
  createCallerFactory,
} from "~/server/api/trpc";
import { initializeSettings } from "./routers/Settings/initializeSettings";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
//& Création du routeur principal en combinant les sous-routeurs
export const appRouter = createTRPCRouter({
  buckets: bucketsRouter,
  auth: authRouter,
  openai: openaiRouter,
  anthropic: anthropicRouter,
  mistral: mistralRouter,
  google: googleRouter,
  user: userRouter,
  tools: toolsRouter,
  message: messagesRouter,
  speedCreate: speedCreateRouter,
  dbBackupRestore: dbBackupRestore,
  settings: settingsRouter,
  userModels: UserModelsRouter,
  availableModels: availableModelsRouter,
  adminModels: adminModelsRouter,
  provider: providerRouter,
  log: logRouter,
  taskProgress: taskProgressRouter,
});

//& Exportation du type de l'API
export type AppRouter = typeof appRouter;

//& Création de la fabrique d'appel côté serveur
export const createCaller = async (headers: Headers) => {
  const context = await createTRPCContext({ headers });
  return createCallerFactory(appRouter)(context);
};

// Initialiser les paramètres système au démarrage (pas pendant next build)
if (process.env.NEXT_PHASE !== "phase-production-build") {
  initializeSettings().catch(() => {
    // Silencieux si DB indisponible (ex. build sans Postgres)
  });
}
