import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "~/server/db";
import { CleanupService } from "~/server/services/cleanupService";
type AccountType = string;

declare module "next-auth" {
  interface User {
    id: string;
    accountType: AccountType;
    sessionToken: string | null;
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
    // Version locale : pas d'attribution de config à l'inscription
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

        // Nettoyage opportuniste des accès expirés (app locale)
        try {
          await CleanupService.cleanupUserExpiredAccess(user.id);
        } catch (error) {
          console.error("Erreur lors du nettoyage opportuniste:", error);
          // Ne pas bloquer la connexion si le nettoyage échoue
        }

        return {
          id: user.id,
          accountType: user.accountType,
          sessionToken: newSessionToken,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
