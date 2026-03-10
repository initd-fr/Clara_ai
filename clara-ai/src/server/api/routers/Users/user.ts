// TODO ROUTES UTILISATEUR POUR LE SUPPORT
// ~  ///////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { z } from "zod";
import { hash } from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  //& Inscription publique
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(128),
        password: z.string().max(40),
        firstName: z.string(),
        lastName: z.string(),
        accountType: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { email, password, firstName, lastName, accountType } = input;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un utilisateur avec cet email existe déjà",
        });
      }

      // Hash du mot de passe
      const hashedPassword = await hash(password, 12);

      // Créer l'utilisateur
      const newUser = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          accountType,
          role: "user",
        },
      });

      // Récupérer l'abonnement par défaut
      const defaultSubConfig = await db.subscriptionConfig.findFirst({
        where: { isDefault: true },
      });

      // Assigner l'abonnement par défaut si disponible
      if (defaultSubConfig) {
        await db.userSubscription.create({
          data: {
            userId: newUser.id,
            configId: defaultSubConfig.id,
            status: "active",
            expiresAt: null, // Pas de date d'expiration pour l'abonnement par défaut
          },
        });

        // Mettre à jour l'utilisateur avec le nom de l'abonnement
        await db.user.update({
          where: { id: newUser.id },
          data: {
            accountType: defaultSubConfig.name,
          },
        });
      }

      // Créer le log d'inscription
      await db.userLogs.create({
        data: {
          userId: newUser.id,
          action: "CREATE_ACCOUNT",
          firstName,
          lastName,
          email,
          description: "Création du compte via inscription manuelle",
        },
      });

      return {
        message: "Compte créé avec succès",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      };
    }),

  //& Recupérer l'utilisateur courant
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // Correction TS : accès sécurisé à user
    const sessionUser =
      typeof ctx.session === "object" &&
      ctx.session !== null &&
      "user" in ctx.session
        ? (ctx.session as any).user
        : undefined;
    const userId = sessionUser?.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Utilisateur non authentifié",
      });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    return user;
  }),
  //& Mettre à jour les informations de l'utilisateur
  updatePassword: protectedProcedure
    .input(
      z
        .object({
          currentPassword: z
            .string()
            .min(1, "L'ancien mot de passe est requis"),
          newPassword: z
            .string()
            .min(8, "Le mot de passe doit contenir au moins 8 caractères")
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
              "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
            )
            .max(40)
            .optional(),
          apiKey: z.string().optional(),
        })
        .refine((data) => data.newPassword || data.apiKey, {
          message:
            "Vous devez fournir au moins un champ : nouveau mot de passe ou clé API.",
          path: ["newPassword", "apiKey"],
        }),
    )
    .mutation(
      async ({
        ctx: { session, db },
        input: { currentPassword, newPassword, apiKey },
      }) => {
        //TODO Vérifier l'existence de l'utilisateur
        const user = await db.user.findUnique({
          where: { id: session.user.id },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Utilisateur non trouvé.",
          });
        }

        //TODO Vérifier l'ancien mot de passe
        const isPasswordValid = await hash(currentPassword, 10);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "L'ancien mot de passe est incorrect.",
          });
        }

        const dataToUpdate: any = {};

        if (newPassword) {
          dataToUpdate.password = await hash(newPassword, 10);
          dataToUpdate.passwordLastChanged = new Date();
        }

        if (apiKey) {
          dataToUpdate.apiKey = apiKey;
        }

        try {
          const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: dataToUpdate,
          });

          // Log de modification du mot de passe
          await db.userLogs.create({
            data: {
              userId: session.user.id,
              action: "UPDATE_PASSWORD",
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              description: "Modification du mot de passe par l'utilisateur",
            },
          });

          return {
            message: "Vos informations ont bien été mises à jour.",
            user: updatedUser,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Une erreur s'est produite lors de la mise à jour des informations.",
          });
        }
      },
    ),
  //& Réinitialiser les messages journaliers
  resetDailyMessages: protectedProcedure.mutation(
    async ({ ctx: { db, session } }) => {
      // Correction TS : accès sécurisé à user
      const sessionUser =
        typeof session === "object" && session !== null && "user" in session
          ? (session as any).user
          : undefined;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non authentifié",
        });
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      // Force la réinitialisation pour le test
      await db.user.update({
        where: { id: userId },
        data: {
          currentDailyMessages: 0,
          lastReset: new Date(),
        },
      });
      return true;
    },
  ),
  //& Récupérer le nombre de messages quotidiens
  getDailyMessages: protectedProcedure.query(async ({ ctx }) => {
    // Correction TS : accès sécurisé à user
    const sessionUser =
      typeof ctx.session === "object" &&
      ctx.session !== null &&
      "user" in ctx.session
        ? (ctx.session as any).user
        : undefined;
    const userId = sessionUser?.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Utilisateur non authentifié",
      });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        currentDailyMessages: true,
        lastReset: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier si c'est un nouveau jour
    const now = new Date();
    const lastReset = user.lastReset ?? new Date(0);

    // Comparer les dates (jour/mois/année) plutôt que les heures
    const isNewDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      // Réinitialiser le compteur
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          currentDailyMessages: 0,
          lastReset: now,
        },
      });
      return 0;
    }

    return user.currentDailyMessages ?? 0;
  }),

  // Version locale : réponse statique sans abonnements (tout autorisé, pas de store)
  getSubscriptionInfo: protectedProcedure.query(async () => {
    return {
      hasSubscription: true,
      subscriptionName: "Local",
      dailyMessageLimit: null,
      storageLimitGB: null,
      canCreatePersonalModels: true,
      canAccessStoreModels: false,
      maxPersonalModels: null,
      category: null,
    };
  }),

  // === SUPPRESSION D'UTILISATEUR ===

  // Suppression par l'utilisateur lui-même
  deleteOwnAccount: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx: { db, session } }) => {
      try {
        const userId = session.user.id;

        console.log(
          `🔍 [DELETE_OWN_ACCOUNT] Début de la suppression pour l'utilisateur ${userId}`,
        );

        // Récupérer les informations de l'utilisateur avant suppression
        const userToDelete = await db.user.findUnique({
          where: { id: userId },
          include: {
            userSubscriptions: true,
            storeAccess: true,
            models: {
              include: {
                documents: true,
                messages: true,
              },
            },
            messages: {
              include: {
                document: true,
              },
            },
            tickets: true,
            StoreChat: true,
            UserLogs: true,
            account: true,
          },
        });

        if (!userToDelete) {
          console.log(
            `❌ [DELETE_OWN_ACCOUNT] Utilisateur ${userId} non trouvé`,
          );
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Utilisateur non trouvé",
          });
        }

        console.log(
          `✅ [DELETE_OWN_ACCOUNT] Utilisateur trouvé: ${userToDelete.email} (${userToDelete.role})`,
        );
        console.log(`📊 [DELETE_OWN_ACCOUNT] Données à supprimer:`, {
          userSubscriptions: userToDelete.userSubscriptions.length,
          storeAccess: userToDelete.storeAccess.length,
          models: userToDelete.models.length,
          messages: userToDelete.messages.length,
          tickets: userToDelete.tickets.length,
          storeChats: userToDelete.StoreChat.length,
        });

        // Log détaillé des modèles
        console.log(
          `🔍 [DELETE_OWN_ACCOUNT] Détail des modèles:`,
          userToDelete.models.map((m) => ({
            id: m.id,
            name: m.name,
            isTemplate: m.isTemplate,
            userId: m.userId,
            documents: m.documents.length,
          })),
        );

        // 1. Supprimer manuellement les données
        console.log(
          `🗑️ [DELETE_OWN_ACCOUNT] Début de la suppression des données en base`,
        );
        await db.$transaction(async (tx) => {
          // Supprimer les accès aux modèles store
          console.log(`🔗 [DELETE_OWN_ACCOUNT] Suppression des accès store`);
          await tx.storeAccess.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les abonnements utilisateur
          console.log(
            `📋 [DELETE_OWN_ACCOUNT] Suppression des abonnements utilisateur`,
          );
          await tx.userSubscription.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les tickets de support
          console.log(`🎫 [DELETE_OWN_ACCOUNT] Suppression des tickets`);
          await tx.ticket.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les conversations store
          console.log(
            `💬 [DELETE_OWN_ACCOUNT] Suppression des conversations store`,
          );
          await tx.storeChat.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les messages et leurs documents associés
          console.log(`💬 [DELETE_OWN_ACCOUNT] Suppression des messages`);
          const userMessages = await tx.message.findMany({
            where: { userId: userId },
            include: { document: true },
          });
          console.log(
            `📝 [DELETE_OWN_ACCOUNT] ${userMessages.length} messages trouvés`,
          );

          for (const message of userMessages) {
            if (message.document) {
              // Supprimer le document de MinIO si nécessaire
              // (la logique de suppression MinIO sera gérée par les modèles)
              await tx.document.delete({
                where: { id: message.document.id },
              });
            }
          }

          await tx.message.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les modèles personnels et leurs documents/embeddings
          console.log(
            `🤖 [DELETE_OWN_ACCOUNT] Suppression des modèles personnels`,
          );
          const userModels = await tx.models.findMany({
            where: {
              userId: userId,
              isTemplate: false, // Seulement les modèles personnels
            },
            include: {
              documents: true,
              messages: true,
            },
          });
          console.log(
            `🔧 [DELETE_OWN_ACCOUNT] ${userModels.length} modèles personnels trouvés`,
          );

          for (const model of userModels) {
            console.log(
              `🗂️ [DELETE_OWN_ACCOUNT] Suppression du modèle ${model.name} (ID: ${model.id})`,
            );
            // Supprimer les documents (les embeddings sont stockés dans le champ embedding du document)
            for (const document of model.documents) {
              console.log(
                `📄 [DELETE_OWN_ACCOUNT] Suppression du document ${document.name}`,
              );
              // Supprimer le document (les embeddings sont inclus dans le document)
              await tx.document.delete({
                where: { id: document.id },
              });
            }

            // Supprimer les messages du modèle
            await tx.message.deleteMany({
              where: { modelId: model.id },
            });

            // Supprimer le modèle
            await tx.models.delete({
              where: { id: model.id },
            });
          }

          // Supprimer les logs utilisateur
          console.log(
            `📋 [DELETE_OWN_ACCOUNT] Suppression des logs utilisateur`,
          );
          await tx.userLogs.deleteMany({
            where: { userId: userId },
          });

          // Supprimer les comptes OAuth (Account)
          console.log(`🔐 [DELETE_OWN_ACCOUNT] Suppression des comptes OAuth`);
          await tx.account.deleteMany({
            where: { userId: userId },
          });

          // Supprimer l'utilisateur de la base de données
          console.log(
            `👤 [DELETE_OWN_ACCOUNT] Suppression de l'utilisateur de la base de données`,
          );
          await tx.user.delete({
            where: { id: userId },
          });
          console.log(
            `✅ [DELETE_OWN_ACCOUNT] Utilisateur ${userToDelete.email} supprimé de la base de données`,
          );
        });
        console.log(
          `✅ [DELETE_OWN_ACCOUNT] Transaction de suppression terminée avec succès`,
        );

        console.log(
          `🎉 [DELETE_OWN_ACCOUNT] Suppression complète de l'utilisateur ${userToDelete.email} terminée avec succès`,
        );
        return {
          success: true,
          message: "Votre compte a été supprimé avec succès",
        };
      } catch (error) {
        console.error(
          `❌ [DELETE_OWN_ACCOUNT] Erreur lors de la suppression:`,
          error,
        );
        if (error instanceof TRPCError) {
          console.error(`❌ [DELETE_OWN_ACCOUNT] TRPCError:`, error.message);
          throw error;
        }
        console.error(`❌ [DELETE_OWN_ACCOUNT] Erreur inattendue:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Une erreur s'est produite lors de la suppression du compte",
          cause: error,
        });
      }
    }),
});
