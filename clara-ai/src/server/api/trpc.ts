/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "~/server/nextAuth";
import { db, getMinio } from "~/server/db";
import { PrismaClient } from "@prisma/client";
import { settingsManager } from "~/server/api/routers/Settings/settingsManager";
import Bottleneck from "bottleneck";
/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

//& Configuration des limiters par rôle optimisée selon l'environnement
const limiters = {
  default: new Bottleneck({
    maxConcurrent: 2,
    minTime: 100,
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 60 * 1000,
    trackDoneStatus: true,
    highWater: 1000,
    strategy: Bottleneck.strategy.LEAK,
    id: "default-limiter",
  }),
  premium: new Bottleneck({
    maxConcurrent: 5,
    minTime: 100,
    reservoir: 500,
    reservoirRefreshAmount: 500,
    reservoirRefreshInterval: 60 * 1000,
    trackDoneStatus: true,
    highWater: 2500,
    strategy: Bottleneck.strategy.LEAK,
    id: "premium-limiter",
  }),
  enterprise: new Bottleneck({
    maxConcurrent: 10,
    minTime: 100,
    reservoir: 1000,
    reservoirRefreshAmount: 1000,
    reservoirRefreshInterval: 60 * 1000,
    trackDoneStatus: true,
    highWater: 5000,
    strategy: Bottleneck.strategy.LEAK,
    id: "enterprise-limiter",
  }),
  support: new Bottleneck({
    maxConcurrent: 20,
    minTime: 50,
    reservoir: 2000,
    reservoirRefreshAmount: 2000,
    reservoirRefreshInterval: 60 * 1000,
    trackDoneStatus: true,
    highWater: 10000,
    strategy: Bottleneck.strategy.LEAK,
    id: "support-limiter",
  }),
};

//& Création du contexte pour tRPC optimisé pour Mac M1
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerAuthSession();

  // Optimisation : Charger les settings avec cache optimisé
  // On garde l'appel mais avec un cache plus long en dev
  await settingsManager.get("lastSettingsUpdate");

  return {
    db: db as PrismaClient,
    minio: getMinio(),
    session,
    ...opts,
  };
};

//& Initialisation de tRPC avec SuperJSON et la gestion des erreurs
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

//& Middleware pour le rate limiting
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  // Correction TS : accès sécurisé à user
  const sessionUser =
    typeof ctx.session === "object" &&
    ctx.session !== null &&
    "user" in ctx.session
      ? (ctx.session as any).user
      : undefined;
  const role = sessionUser?.role || "user";

  // Nouvelle logique : déterminer le limiter basé sur les permissions réelles
  let limiter = limiters.default; // Limiter par défaut

  if (role === "support" || role === "admin") {
    limiter = limiters.support;
  }
  // App locale : un seul limiter pour tous les utilisateurs

  try {
    // Ajouter la requête à la file d'attente
    return await limiter.schedule(async () => {
      return next();
    });
  } catch (error) {
    if (error instanceof Bottleneck.BottleneckError) {
      // Calculer le temps d'attente estimé
      const queued = await limiter.queued();
      const estimatedWait = Math.ceil((queued * 100) / 1000); // Conversion en secondes avec minTime fixe de 100ms

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Trop de requêtes. Temps d'attente estimé : ${estimatedWait} seconde${estimatedWait > 1 ? "s" : ""}. Veuillez réessayer dans quelques instants.`,
      });
    }
    throw error;
  }
});

//& Middleware pour vérifier la validité de la session utilisateur
const checkSessionTokenMiddleware = t.middleware(async ({ ctx, next }) => {
  const { session } = ctx;

  // Correction TS : accès sécurisé à user
  const sessionUser =
    typeof session === "object" && session !== null && "user" in session
      ? (session as any).user
      : undefined;

  if (!sessionUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "FORCE_LOGOUT",
    });
  }

  const userId = sessionUser.id;
  const sessionToken = sessionUser.sessionToken;

  // Récupère les tokens en base
  const userInDb = await db.user.findUnique({
    where: { id: userId },
    select: { sessionToken: true, previousToken: true },
  });

  // Si le token courant n'est ni le sessionToken ni le previousToken, on déconnecte
  if (
    sessionToken !== userInDb?.sessionToken &&
    sessionToken !== userInDb?.previousToken
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "FORCE_LOGOUT",
    });
  }

  // Si le token courant est le previousToken, on déconnecte (ancienne session)
  if (sessionToken === userInDb?.previousToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "FORCE_LOGOUT",
    });
  }

  // Si le token courant est le sessionToken, on laisse passer (session active)
  return next({
    ctx: {
      ...ctx,
      session: session
        ? { ...session, user: sessionUser }
        : { user: sessionUser },
    },
  });
});

//TODO Créez le routeur et les procédures avec le middleware pour les routes protégées
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure
  .use(checkSessionTokenMiddleware)
  .use(rateLimitMiddleware);

// Procédure spéciale pour la déconnexion qui ne vérifie pas la session
export const logoutProcedure = t.procedure.use(rateLimitMiddleware);

//TODO Exportation de la fabrique d'appel côté serveur
export const createCallerFactory = t.createCallerFactory;
