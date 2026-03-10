// ! ///////////////////////////////////////////////////////////////////////////////SUPPORT TYPES///////////////////////////////////////////////////////////////////////////////////

// ? ///////////////////////////////////////////////////////////////////////////////PROVIDER TYPE//////////////////////////////////////////////////////////////////////////////////
/**
 * Type représentant un fournisseur de modèles LLM (ex: OpenAI, Anthropic, etc.)
 * @property value - Identifiant unique du provider (ex: "openai", "anthropic")
 * @property label - Nom d'affichage du provider
 * @property enabled - Indique si le provider est actuellement actif
 */
export type Provider = {
  value: string;
  label: string;
  enabled: boolean;
};

// & ///////////////////////////////////////////////////////////////////////////////LLM TYPE//////////////////////////////////////////////////////////////////////////////////////
/**
 * Type représentant un modèle de langage (LLM) avec ses configurations
 * @property llmId - Identifiant unique du LLM
 * @property llmValue - Nom technique du modèle (ex: "gpt-4", "claude-2")
 * @property llmLabel - Nom d'affichage du modèle
 * @property llmText - Description courte ou badge du modèle
 * @property llmClassName - Classes CSS pour le style du modèle dans l'UI
 * @property llmEnabled - Indique si le modèle est disponible
 * @property llmTemperatureIsForced - Indique si la température est fixée
 * @property llmTemperatureForcedValue - Valeur de température forcée si applicable
 * @property llmMaxInputTokens - Nombre maximum de tokens en entrée
 * @property llmMaxOutputTokens - Nombre maximum de tokens en sortie
 * @property provider - Identifiant du provider associé
 * @property description - Description détaillée du modèle (optionnel)
 * @property availableSubscriptions - Liste des types d'abonnements ayant accès à ce modèle
 */
export type LLM = {
  llmId: number;
  llmValue: string;
  llmLabel: string;
  llmText: string;
  llmClassName: string;
  llmEnabled: boolean;
  llmIsDefault: boolean;
  llmMaxInputTokens: number;
  llmMaxOutputTokens: number;
  provider: string;
  description?: string;
  availableSubscriptions: string[];
};

// ^ ///////////////////////////////////////////////////////////////////////////////SETTING TYPE//////////////////////////////////////////////////////////////////////////////////
/**
 * Type représentant un paramètre système
 * @property key - Clé unique du paramètre
 * @property value - Valeur du paramètre
 * @property isNumber - Indique si la valeur doit être traitée comme un nombre
 * @property toolType - Type d'outil associé au paramètre
 * @property categoryId - ID de la catégorie (optionnel)
 */
export type Setting = {
  key: string;
  value: string;
  isNumber: boolean;
  toolType: string;
  categoryId: number | null;
};
