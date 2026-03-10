export enum LogLevel {
  DEBUG = "debug",
  ERROR = "error",
  CRITICAL = "critical",
}

export function log(logLevel: LogLevel, message: string): never | void {
  switch (logLevel) {
    case LogLevel.DEBUG:
      console.debug("DEBUG ################# >" + message);
      break;
    case LogLevel.ERROR:
      console.error("ERROR @@@@@@@@@@@@@@@@@ >" + message);
      // Ajout de log dans le fichier log TODO
      break;
    case LogLevel.CRITICAL:
      console.error("CRITICAL %%%%%%%%%%%%%% >" + message);
      // Ajout de log dans le fichier log TODO
      // Envoi d'un mail d'urgence pour erreur grave TODO
      throw new Error(message);
  }
}
