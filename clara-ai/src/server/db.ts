/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////
import { PrismaClient } from "@prisma/client";
import * as Minio from "minio";
import { env } from "~/env";
/////////////////////////////////////////////////////////////////////////////////IMPORTS//////////////////////////////////////////////////////////////////////////////////////

// Déclaration du type global pour le singleton Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var minio: Minio.Client | undefined;
}

// Configuration du client Prisma avec gestion des connexions
const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["error", "warn"] // Seulement les erreurs et warnings en dev
        : ["error"], // Seulement les erreurs en prod
  });

// Fonction pour créer le client MinIO (ne s'exécute que quand appelée)
const getMinioClient = () => {
  const port = process.env.MINIO_PORT
    ? parseInt(process.env.MINIO_PORT, 10)
    : 443;
  const useSSL = process.env.MINIO_USESSL !== "0";
  return new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port,
    useSSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  });
};

// Singleton Prisma
export const db = global.prisma ?? createPrismaClient();

// Export lazy pour MinIO - ne s'exécute que quand appelé
export const getMinio = () => global.minio ?? getMinioClient();

// En développement, on garde une seule instance
if (env.NODE_ENV !== "production") {
  global.prisma = db;
  global.minio = getMinio();
}

//TODO Fonction pour tester la connexion MinIO
export const testMinioConnection = async () => {
  try {
    const minioClient = getMinio();
    await minioClient.listBuckets();
    return true;
  } catch (error) {
    console.error("Erreur de connexion MinIO:", error);
    return false;
  }
};

//TODO Fonction pour reconnecter MinIO si nécessaire
export const reconnectMinio = async () => {
  try {
    const isConnected = await testMinioConnection();
    if (!isConnected) {
      global.minio = getMinioClient();
      await testMinioConnection();
    }
    return true;
  } catch (error) {
    console.error("Erreur de reconnexion MinIO:", error);
    return false;
  }
};

// Ajout du healthcheck périodique
export const startMinioHealthCheck = () => {
  setInterval(async () => {
    try {
      await testMinioConnection();
    } catch (error) {
      console.error("Healthcheck MinIO échoué:", error);
      await reconnectMinio();
    }
  }, 300000); // Toutes les 5 minutes
};

// Démarrer le healthcheck au démarrage de l'application
if (env.NODE_ENV === "production") {
  startMinioHealthCheck();
}
