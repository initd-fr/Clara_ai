// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  logoutProcedure,
} from "~/server/api/trpc";
import type { Session } from "next-auth";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

// ? ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
// ^  ////////////////////////////////////////////////////////////////////////CLASS/////////////////////////////////////////////////////////////////////////////////////////

// & ////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

// * ////////////////////////////////////////////////////////////////////////ROUTER/////////////////////////////////////////////////////////////////////////////////////////
// & Auth Router
//TODO Router pour gérer l'authentification, la session et la déconnexion
export const authRouter = createTRPCRouter({
  // Vérifie la validité de la session utilisateur
  checkSession: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    const user = await db.user.findUnique({
      where: { id: session.user.id.toString() },
      select: { sessionToken: true },
    });

    if (!user || session.user.sessionToken !== user.sessionToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session invalide. Veuillez vous reconnecter.",
      });
    }

    return { valid: true };
  }),

  // Gère la déconnexion de l'utilisateur
  logout: logoutProcedure.mutation(async ({ ctx: { db, session } }) => {
    const typedSession = session as Session;
    if (!typedSession?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Utilisateur non authentifié",
      });
    }

    const user = await db.user.findUnique({
      where: { id: typedSession.user.id },
      select: { sessionToken: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    // Mettre à jour l'utilisateur avec le token précédent
    await db.user.update({
      where: { id: typedSession.user.id },
      data: {
        previousToken: user.sessionToken,
        sessionToken: null,
        isOnline: false,
      },
    });

    // Créer un log de déconnexion
    await db.userLogs.create({
      data: {
        userId: typedSession.user.id,
        action: "LOGOUT",
        firstName: typedSession.user.firstName,
        lastName: typedSession.user.lastName,
        email: typedSession.user.email,
        description: "Déconnexion de l'utilisateur",
      },
    });

    return { success: true };
  }),
});
