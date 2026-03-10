////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
/**
 * Représente une section mise en surbrillance dans un document
 */
export type DocumentHighlight = {
  /** Le texte mis en surbrillance */
  text: string;
  /** Position de début et fin dans le document */
  position: {
    start: number;
    end: number;
  };
};

/**
 * Métadonnées d'un document traité
 */
export type DocumentMetadata = {
  /** Source du document (fichier, URL, etc.) */
  source: string;
  /** URL du document */
  url: string;
  /** ID optionnel du document en base */
  documentId?: number;
  /** Contenu textuel du document */
  text: string;
  /** Contenu de la page actuelle */
  pageContent: string;
  /** Sections mises en surbrillance */
  highlights?: DocumentHighlight[];
};

/**
 * Document traité et prêt pour l'utilisation
 */
export type ProcessedDocument = {
  /** Nom du document */
  name: string;
  /** Contenu textuel complet */
  text: string;
  /** URL source */
  url: string;
  /** Sections mises en surbrillance */
  highlights: DocumentHighlight[];
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
