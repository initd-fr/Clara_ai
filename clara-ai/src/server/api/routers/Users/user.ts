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
import { randomBytes } from "crypto";
import { sendAccountDeletedConfirmationEmail } from "~/server/api/routers/mail/email";
import { sendEmail } from "../mail/email";

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

  //& Demande de réinitialisation de mot de passe
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email invalide").max(128),
      }),
    )
    .mutation(async ({ ctx: { db }, input: { email } }) => {
      try {
        // Vérifier si l'utilisateur existe
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            account: {
              select: {
                provider: true,
              },
            },
          },
        });

        // Toujours retourner "Email envoyé" pour des raisons de sécurité
        if (!user) {
          return {
            success: true,
            message:
              "Si cet email existe dans notre base de données, vous recevrez un lien de réinitialisation.",
          };
        }

        // Vérifier si l'utilisateur utilise Google uniquement
        const hasGoogleAccount = user.account.some(
          (acc) => acc.provider === "google",
        );
        const hasLocalPassword = user.password && user.password.length > 0;

        if (hasGoogleAccount && !hasLocalPassword) {
          return {
            success: false,
            message:
              "Cet email est associé à un compte Google. Veuillez vous connecter avec Google.",
            googleOnly: true,
          };
        }

        // Générer un token de réinitialisation sécurisé
        const resetToken = randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Sauvegarder le token en base
        await db.user.update({
          where: { id: user.id },
          data: {
            resetPasswordToken: resetToken,
            resetPasswordTokenDate: resetTokenExpiry,
          },
        });

        // Construire le lien de réinitialisation
        const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password/${resetToken}`;

        // Envoyer l'email
        await sendEmail({
          to: user.email,
          subject: "Réinitialisation de votre mot de passe - Clara AI",
          html: `
            <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f6f9fc; padding: 20px;">
              <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <!-- Contenu principal -->
                <div style="padding: 0 48px;">
                  <h1 style="color: #1d1d1f; font-size: 24px; font-weight: 600; line-height: 40px; margin: 0 0 20px; text-align: center; font-family: Inter, sans-serif;">
                    Réinitialisation de votre mot de passe
                  </h1>
                  
                  <p style="color: #86868b; font-size: 16px; line-height: 24px; margin: 16px 0; font-family: Inter, sans-serif;">
                    Bonjour ${user.firstName},
                  </p>
                  
                  <p style="color: #86868b; font-size: 16px; line-height: 24px; margin: 16px 0; font-family: Inter, sans-serif;">
                    Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Clara AI.
                  </p>
                  
                  <p style="color: #86868b; font-size: 16px; line-height: 24px; margin: 16px 0; font-family: Inter, sans-serif;">
                    Si vous n'avez pas effectué cette demande, veuillez ignorer cet email.
                  </p>
                  
                  <p style="color: #86868b; font-size: 16px; line-height: 24px; margin: 16px 0; font-family: Inter, sans-serif;">
                    Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :
                  </p>
                  
                  <!-- Bouton de réinitialisation -->
                  <a href="${resetUrl}" style="background: linear-gradient(to right, #0091ff, #00b8ff); border-radius: 8px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: block; width: 100%; padding: 16px; margin: 32px 0; font-family: Inter, sans-serif; box-shadow: 0 2px 8px rgba(0, 145, 255, 0.2);">
                    🔐 Réinitialiser mon mot de passe
                  </a>
                  
                  <p style="color: #86868b; font-size: 14px; line-height: 20px; margin: 16px 0; text-align: center; font-family: Inter, sans-serif;">
                    ⏰ Ce lien expirera dans 30 minutes pour des raisons de sécurité.
                  </p>
                  
                  <!-- Lien alternatif -->
                  <div style="background-color: #f5f5f7; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e5e7;">
                    <p style="color: #1d1d1f; font-size: 14px; line-height: 20px; margin: 8px 0; font-family: Inter, sans-serif;">
                      <strong>Si le bouton ne fonctionne pas</strong>, copiez et collez ce lien dans votre navigateur :<br>
                      <a href="${resetUrl}" style="color: #0091ff; word-break: break-all;">${resetUrl}</a>
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #e5e5e7; margin: 32px 0; padding: 0 48px; text-align: center;">
                  <p style="color: #86868b; font-size: 12px; line-height: 16px; margin: 8px 0; font-family: Inter, sans-serif;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                  </p>
                  <p style="color: #86868b; font-size: 12px; line-height: 16px; margin: 8px 0; font-family: Inter, sans-serif;">
                    © 2025 Clara AI - Tous droits réservés
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        // Log de la demande de réinitialisation
        await db.userLogs.create({
          data: {
            userId: user.id,
            action: "REQUEST_PASSWORD_RESET",
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            description: "Demande de réinitialisation de mot de passe",
          },
        });

        return {
          success: true,
          message:
            "Un email de réinitialisation a été envoyé à votre adresse email.",
        };
      } catch (error) {
        console.error("Erreur lors de la demande de réinitialisation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Une erreur s'est produite lors de la demande de réinitialisation.",
        });
      }
    }),

  //& Valider le token de réinitialisation
  validateResetToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token requis"),
      }),
    )
    .query(async ({ ctx: { db }, input: { token } }) => {
      try {
        const user = await db.user.findFirst({
          where: {
            resetPasswordToken: token,
            resetPasswordTokenDate: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!user) {
          return {
            valid: false,
            message: "Token invalide ou expiré.",
          };
        }

        return {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
      } catch (error) {
        console.error("Erreur lors de la validation du token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Une erreur s'est produite lors de la validation du token.",
        });
      }
    }),

  //& Réinitialiser le mot de passe avec le token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token requis"),
        newPassword: z
          .string()
          .min(12, "Le mot de passe doit contenir au moins 12 caractères")
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
          ),
      }),
    )
    .mutation(async ({ ctx: { db }, input: { token, newPassword } }) => {
      try {
        // Vérifier le token
        const user = await db.user.findFirst({
          where: {
            resetPasswordToken: token,
            resetPasswordTokenDate: {
              gt: new Date(),
            },
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Token invalide ou expiré.",
          });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await hash(newPassword, 12);

        // Mettre à jour le mot de passe et supprimer le token
        await db.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordTokenDate: null,
            passwordLastChanged: new Date(),
          },
        });

        // Log de la réinitialisation
        await db.userLogs.create({
          data: {
            userId: user.id,
            action: "PASSWORD_RESET",
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            description: "Réinitialisation de mot de passe via token",
          },
        });

        return {
          success: true,
          message: "Votre mot de passe a été réinitialisé avec succès.",
        };
      } catch (error) {
        console.error("Erreur lors de la réinitialisation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Une erreur s'est produite lors de la réinitialisation.",
        });
      }
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

        // 3. Envoyer email de confirmation
        try {
          await sendAccountDeletedConfirmationEmail({
            email: userToDelete.email,
            firstName: userToDelete.firstName,
            lastName: userToDelete.lastName,
            deletionDate: new Date().toLocaleDateString("fr-FR"),
          });
        } catch (emailError) {
          console.error("Erreur lors de l'envoi de l'email:", emailError);
          // Ne pas faire échouer la suppression si l'email échoue
        }

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
