import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "~/server/db";
import { CleanupService } from "~/server/services/cleanupService";
import type { Role } from "@prisma/client";

type AccountType = string;

declare module "next-auth" {
  interface User {
    id: string;
    accountType: AccountType;
    sessionToken: string | null;
    role: Role;
    email: string;
    firstName: string;
    lastName: string;
  }
  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accountType: AccountType;
    sessionToken: string | null;
    role: Role;
    email: string;
    firstName: string;
    lastName: string;
    exp?: number;
  }
}

export const authOptions: any = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth/error",
    newUser: "/home",
  },
  events: {
    // Version locale : plus d'attribution d'abonnement à l'inscription
    async signOut({ session }: { session: any }) {
      if (session?.user?.id) {
        await db.user.update({
          where: { id: session.user.id },
          data: {
            previousToken: session.user.sessionToken,
            sessionToken: null,
          },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
        token.sessionToken = user.sessionToken;
        token.role = user.role;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async signIn({
      user,
      account,
      profile,
    }: {
      user: any;
      account: any;
      profile: any;
    }) {
      if (!user.email) throw new Error("Email requis");

      const existingUser = await db.user.findUnique({
        where: { email: user.email },
      });

      const profileFirstName = (profile as any)?.given_name || "";
      const profileLastName = (profile as any)?.family_name || "";

      if (account?.provider === "google") {
        try {
          // Vérifier si l'utilisateur existe déjà
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            // Créer un nouvel utilisateur
            const newUser = await db.user.create({
              data: {
                email: user.email,
                firstName: profileFirstName,
                lastName: profileLastName,
                role: "user",
                accountType: "free",
                password: "", // Pas de mot de passe pour les comptes Google
              },
            });

            // Créer le compte Google
            await db.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });

            // Générer un token de session pour le nouvel utilisateur
            const newSessionToken = randomBytes(32).toString("hex");
            await db.user.update({
              where: { id: newUser.id },
              data: {
                sessionToken: newSessionToken,
                isOnline: true,
                lastConnection: new Date(),
              },
            });

            // Log de la création du compte
            await db.userLogs.create({
              data: {
                userId: newUser.id,
                action: "CREATE_ACCOUNT",
                firstName: profileFirstName,
                lastName: profileLastName,
                email: user.email,
                description: "Création du compte via Google",
              },
            });

            // Mettre à jour l'utilisateur dans le token
            user.id = newUser.id;
            user.sessionToken = newSessionToken;

            return true;
          } else {
            // Vérifier si le compte Google existe déjà
            const existingAccount = await db.account.findFirst({
              where: {
                userId: dbUser.id,
                provider: "google",
              },
            });

            if (!existingAccount) {
              // Lier le compte Google à l'utilisateur existant
              await db.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }

            // Générer un nouveau token de session
            const newSessionToken = randomBytes(32).toString("hex");
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                sessionToken: newSessionToken,
                previousToken: dbUser.sessionToken,
                isOnline: true,
                lastConnection: new Date(),
              },
            });

            // Log de la connexion
            await db.userLogs.create({
              data: {
                userId: dbUser.id,
                action: "LOGIN",
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                email: dbUser.email,
                description: "Connexion via Google",
              },
            });

            // Mettre à jour l'utilisateur dans le token
            user.id = dbUser.id;
            user.sessionToken = newSessionToken;
          }

          return true;
        } catch (error) {
          console.error("Erreur lors de la connexion Google:", error);
          return false;
        }
      }

      // Réinitialiser les messages journaliers à la connexion si nécessaire
      if (existingUser) {
        const now = new Date();
        const lastReset = existingUser.lastReset || now;
        const isNewDay =
          now.getDate() !== lastReset.getDate() ||
          now.getMonth() !== lastReset.getMonth() ||
          now.getFullYear() !== lastReset.getFullYear();

        if (isNewDay) {
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              currentDailyMessages: 0,
              lastReset: now,
            },
          });
        }
      }

      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id;
      session.user.accountType = token.accountType;
      session.user.sessionToken = token.sessionToken;
      session.user.role = token.role;
      session.user.email = token.email;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Si l'URL contient /api/auth/signout, rediriger vers /auth
      if (url.includes("/api/auth/signout")) {
        return "/auth";
      }
      // Sinon, rediriger vers l'URL fournie ou la baseUrl
      return url || baseUrl;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new Error("Identifiants manquants.");

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !(await compare(credentials.password, user.password)))
          throw new Error("Nom d'utilisateur ou mot de passe incorrect.");

        // Vérifier si une session est déjà active
        if (user.sessionToken) {
          // Au lieu de bloquer, on déconnecte la session existante
          await db.user.update({
            where: { id: user.id },
            data: {
              previousToken: user.sessionToken,
              sessionToken: null,
              isOnline: false,
            },
          });

          // Log de la déconnexion forcée
          await db.userLogs.create({
            data: {
              userId: user.id,
              action: "FORCED_LOGOUT",
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              description: "Déconnexion forcée suite à une nouvelle connexion",
            },
          });

          // Attendre un court instant pour s'assurer que la déconnexion est bien prise en compte
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Générer un nouveau token de session
        const newSessionToken = randomBytes(32).toString("hex");
        await db.user.update({
          where: { id: user.id },
          data: {
            sessionToken: newSessionToken,
            previousToken: user.sessionToken,
            isOnline: true,
            lastConnection: new Date(),
          },
        });

        // Log de la connexion
        await db.userLogs.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            description: "Connexion via email/mot de passe",
          },
        });

        // Nettoyage opportuniste des accès expirés
        try {
          await CleanupService.cleanupUserExpiredAccess(user.id);
          await CleanupService.cleanupUserExpiredSubscriptions(user.id);
        } catch (error) {
          console.error("Erreur lors du nettoyage opportuniste:", error);
          // Ne pas bloquer la connexion si le nettoyage échoue
        }

        return {
          id: user.id,
          accountType: user.accountType,
          sessionToken: newSessionToken,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
