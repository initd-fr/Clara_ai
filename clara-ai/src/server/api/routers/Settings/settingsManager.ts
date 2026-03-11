import { db } from "~/server/db";
import { log, LogLevel } from "~/globalUtils/debug";
import { env } from "~/env";

// 🔵 TYPES & INTERFACES
type SettingValue = string | number | boolean;

interface Setting {
  key: string;
  value: SettingValue;
  type: "string" | "number" | "boolean";
  categoryId?: number | null;
  description?: string;
  defaultValue?: SettingValue;
  isNumber: boolean;
  toolType: string;
}

// 🟡 CLASS DEFINITION
class SettingsManager {
  // 🔒 PRIVATE PROPERTIES
  private static instance: SettingsManager;
  private cache: Map<string, Setting> = new Map();
  private lastFetch: number = 0;
  private readonly REFRESH_INTERVAL =
    env.NODE_ENV === "development"
      ? 600 * 1000 // 10 minutes en dev (au lieu de 5)
      : 3600 * 1000; // 1 heure en prod (au lieu de 2 minutes)
  private readonly PERFORMANCE_SETTINGS = {
    MAX_HISTORY_TOKENS: 1000,
    MAX_CONTEXT_TOKENS: 2000,
  };
  // Limite de taille du cache pour éviter les fuites mémoire
  private readonly MAX_CACHE_SIZE = 200;

  // 🚫 PRIVATE CONSTRUCTOR (Singleton pattern)
  private constructor() {
    // TODO: Ajouter un système de monitoring pour le cache
    // TODO: Implémenter un système de backup des settings
  }

  // 🔄 SINGLETON INSTANCE
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // 🔄 CACHE MANAGEMENT
  private async refreshCache(force = false): Promise<void> {
    const now = Date.now();

    // ⏱️ Cache validation
    if (!force && now - this.lastFetch < this.REFRESH_INTERVAL) {
      log(LogLevel.DEBUG, "Using cached settings");
      return;
    }

    try {
      // 📦 Fetch settings with relations
      const settings = await db.setting.findMany({
        include: {
          categoryRelation: true,
        },
      });

      // Nettoyer le cache avant de le remplir
      this.cache.clear();

      // 🔄 Update cache avec limite de taille
      let cacheCount = 0;
      for (const setting of settings) {
        if (cacheCount >= this.MAX_CACHE_SIZE) {
          log(
            LogLevel.ERROR,
            `Cache limit reached (${this.MAX_CACHE_SIZE}), stopping cache population`,
          );
          break;
        }

        this.cache.set(setting.key, {
          key: setting.key,
          value: this.parseValue(setting.value, setting.isNumber),
          type: setting.isNumber ? "number" : "string",
          categoryId: setting.categoryId,
          isNumber: setting.isNumber,
          toolType: setting.toolType,
        });
        cacheCount++;
      }

      // ⏰ Update timestamp seulement si on a de la place
      if (cacheCount < this.MAX_CACHE_SIZE) {
        this.cache.set("lastSettingsUpdate", {
          key: "lastSettingsUpdate",
          value: Math.round(Date.now() / 1000),
          type: "number",
          isNumber: true,
          toolType: "lastSettingsUpdate",
        });
      }

      this.lastFetch = now;
      log(LogLevel.DEBUG, `Settings cache refreshed (${cacheCount} items)`);
    } catch (error) {
      // ❌ Error handling
      log(
        LogLevel.ERROR,
        `Failed to refresh settings cache: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  // 🧹 Nettoyage du cache pour éviter les fuites mémoire
  private cleanupCache(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      // Garder seulement les entrées les plus récentes
      const sortedEntries = entries.sort((a, b) => {
        const aTime = typeof a[1].value === "number" ? a[1].value : 0;
        const bTime = typeof b[1].value === "number" ? b[1].value : 0;
        return bTime - aTime;
      });

      this.cache.clear();
      sortedEntries.slice(0, this.MAX_CACHE_SIZE).forEach(([key, value]) => {
        this.cache.set(key, value);
      });

      log(LogLevel.DEBUG, `Cache cleaned, kept ${this.cache.size} items`);
    }
  }

  // 🔢 VALUE PARSING
  private parseValue(value: string, isNumber: boolean): SettingValue {
    if (isNumber) {
      return parseFloat(value);
    }
    return value;
  }

  // 📥 PUBLIC METHODS

  // 🔍 Get a single setting
  public async get<T extends SettingValue>(key: string): Promise<T | null> {
    await this.refreshCache();

    // Nettoyer le cache si nécessaire
    this.cleanupCache();

    const setting = this.cache.get(key);
    return setting ? (setting.value as T) : null;
  }

  // 📝 Set or update a setting
  public async set(
    key: string,
    value: SettingValue,
    options: Partial<Setting> = {},
  ): Promise<void> {
    try {
      const isNumber = typeof value === "number";

      // TODO: Ajouter une validation des valeurs avant sauvegarde
      // TODO: Implémenter un système de versioning des settings

      await db.setting.upsert({
        where: { key },
        update: {
          value: String(value),
          isNumber,
          toolType: options.toolType || "default",
          categoryId: options.categoryId,
        },
        create: {
          key,
          value: String(value),
          isNumber,
          toolType: options.toolType || "default",
          categoryId: options.categoryId,
        },
      });

      await this.refreshCache(true);
    } catch (error) {
      log(
        LogLevel.ERROR,
        `Failed to set setting ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  // 📋 Get all settings
  public async getAll(): Promise<Map<string, Setting>> {
    await this.refreshCache();
    return new Map(this.cache);
  }

  // 🗂️ Get settings by category
  public async getByCategory(categoryId: number): Promise<Setting[]> {
    await this.refreshCache();
    return Array.from(this.cache.values()).filter(
      (setting) => setting.categoryId === categoryId,
    );
  }

  // 🛠️ Get settings by tool type
  public async getByToolType(toolType: string): Promise<Setting[]> {
    await this.refreshCache();
    return Array.from(this.cache.values()).filter(
      (setting) => setting.toolType === toolType,
    );
  }

  // 🔄 Check if settings table is empty
  public async isTableEmpty(): Promise<boolean> {
    const count = await db.setting.count();
    return count === 0;
  }

  // 📝 Initialize default settings
  public async initializeDefaultSettings(): Promise<void> {
    // Vérifier si la table est vide
    const isEmpty = await this.isTableEmpty();
    if (!isEmpty) {
      log(
        LogLevel.DEBUG,
        "La table des paramètres n'est pas vide, pas d'initialisation nécessaire",
      );
      return;
    }

    const defaultSettings = {
      // Prompts système pour les agents et experts
      LLM_SystemPrompt_Agent:
        'Vous êtes un assistant IA conversationnel.\nVotre rôle est d\'aider l\'utilisateur avec des réponses **fiables, précises et vérifiables**. Vous ne devez **jamais inventer d\'informations** : si une réponse ne peut être donnée avec certitude, dites-le clairement.\n\n🔹 Modèle utilisé : {modelName}\n🔹 Utilisateur : {userName}\n\n---\n\n📌 **Contexte défini par l\'utilisateur :**\n{modelPrompt}\n\n📚 **Informations disponibles :**\n{crlf}- 📖 Dernier échange avec l\'utilisateur : {lastExchange}\n{crlf}- 📝 Document temporaire : {temporaryDocumentContext}\n{crlf}- 🌐 Résultats de recherche web : {webSearch}\n{crlf}- 📂 Documents RAG pertinents : {rag}\n\n**Formats de citation attendus :**\n- 📖 Dernier échange : "D\'après notre échange précédent : [citation exacte]"\n- 📝 Document temporaire : "Selon le document fourni : [extrait pertinent]"\n- 🌐 Recherche web : "D\'après [nom du site] : [extrait pertinent]"\n- 📂 Documents RAG : "📄 [Titre du document] : [extrait pertinent]"\n\n**IMPORTANT** : Utilisez ces formats SEULEMENT si la source correspondante est disponible. Si une source n\'est pas fournie, ne l\'utilisez pas.\n\n---\n\n❓ **Question posée par l\'utilisateur :**\n{question}\n\n---\n\n📏 **Règles strictes à respecter :**\n1. Citez explicitement vos sources avec les formats ci-dessus.\n2. Si aucune source ne permet de répondre, indiquez-le clairement.\n3. Ne faites **aucune supposition ni invention**.\n4. Soyez clair, structuré et factuel.\n5. **IMPORTANT** : Ne jamais écrire "context rag", "document RAG" ou des références génériques - toujours citer le titre exact du document.\n6. Si des documents RAG sont fournis, vous DEVEZ les utiliser et les citer explicitement avec le format ci-dessus.\n7. Si aucun document RAG n\'est disponible, indiquez-le clairement dans votre réponse.\n\n---\n\n📝 **FORMATAGE DE RÉPONSE OBLIGATOIRE :**\n\n**Utilisez TOUJOURS le format markdown suivant pour structurer vos réponses :**\n\n## Titres principaux\nPour les sections importantes comme "Explication", "Démonstration", "Utilisation", "Tests", "Exercices", etc.\n\n### Sous-titres\nPour les éléments numérotés (1), 2), 3), etc.) ou les sections comme "Objectif", "Formule", "Résultat", etc.\n\n#### Sous-sous-titres\nPour les éléments avec tirets (- Données:, - Attendu:, - Vérifications:, etc.)\n\n**Pour le code Python, utilisez TOUJOURS des blocs de code :**\n```python\n# Votre code Python ici\ndef exemple():\n    return "Hello World"\n```\n\n**Pour les listes, utilisez le format markdown standard :**\n- Élément 1\n- Élément 2\n  - Sous-élément 2.1\n  - Sous-élément 2.2\n\n**Pour les tableaux, utilisez le format markdown :**\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|-----------|\n| Valeur 1  | Valeur 2  | Valeur 3  |\n\n**Pour les citations importantes, utilisez des blockquotes :**\n> Citation importante ou exemple notable\n\n**Pour mettre en évidence du texte :**\n- **Texte en gras** pour les points importants\n- *Texte en italique* pour les termes techniques\n- `Code inline` pour les variables ou fonctions\n\n**EXEMPLE DE STRUCTURE ATTENDUE :**\n```markdown\n## Explication\n\n### 1) Concept de base\nVoici l\'explication du concept...\n\n#### - Définition\nLa définition précise...\n\n#### - Exemple\n```python\n# Code d\'exemple\nma_variable = "exemple"\n```\n\n### 2) Cas d\'usage\nLes différents cas d\'usage...\n\n## Démonstration\n\n### Code complet\n```python\ndef ma_fonction():\n    return "résultat"\n```\n\n### Résultat attendu\nLe résultat que vous devriez obtenir...\n```\n\n**IMPORTANT** : Respectez scrupuleusement ce formatage markdown pour toutes vos réponses. Cela améliore considérablement la lisibilité et la structure de vos explications.',

      LLM_SystemPrompt_Expert:
        "Vous êtes un assistant IA expert, spécialisé dans le traitement de questions complexes.\nVotre mission est de fournir des réponses **détaillées, techniques et fiables**, en vous basant strictement sur les sources fournies.\nVous devez démontrer rigueur, logique et transparence dans vos raisonnements.\n\n🔹 Modèle utilisé : {modelName}\n🔹 Utilisateur : {userName}\n\n---\n\n📌 **Contexte défini par l'utilisateur :**\n{modelPrompt}\n\n📚 **Sources contextuelles disponibles :**\n{crlf}- 💬 Dernier échange : {lastExchange}\n{crlf}- 📝 Document temporaire : {temporaryDocumentContext}\n{crlf}- 🌐 Résultats de recherche web : {webSearch}\n{crlf}- 📂 Documents RAG pertinents : {rag}\n\n**Formats de citation attendus :**\n- 💬 Dernier échange : \"D'après notre échange précédent : [citation exacte]\"\n- 📝 Document temporaire : \"Selon le document fourni : [extrait pertinent]\"\n- 🌐 Recherche web : \"D'après [nom du site] : [extrait pertinent]\"\n- 📂 Documents RAG : \"📄 [Titre du document] : [extrait pertinent]\"\n\n**IMPORTANT** : Utilisez ces formats SEULEMENT si la source correspondante est disponible. Si une source n'est pas fournie, ne l'utilisez pas.\n\n---\n\n❓ **Question posée par l'utilisateur :**\n{question}\n\n---\n\n📏 **Règles strictes à respecter :**\n1. Appuyez toutes vos affirmations sur les documents ou sources citées ci-dessus.\n2. Utilisez les formats de citation ci-dessus pour chaque source utilisée.\n3. Ne répondez pas si aucune source fiable ne permet de le faire : dites-le explicitement.\n4. N'inventez **jamais** d'information.\n5. Utilisez un langage technique, clair, structuré, adapté à un public averti.\n6. Si des documents RAG sont fournis, vous DEVEZ les utiliser et les citer explicitement avec le format ci-dessus.\n7. Si aucun document RAG n'est disponible, indiquez-le clairement dans votre réponse.\n8. **IMPORTANT** : Ne jamais écrire \"context rag\", \"document RAG\" ou des références génériques - toujours citer le titre exact du document.\n9. Structurez votre réponse avec des sections claires et des citations précises pour chaque point abordé.\n\n---\n\n📝 **FORMATAGE DE RÉPONSE OBLIGATOIRE :**\n\n**Utilisez TOUJOURS le format markdown suivant pour structurer vos réponses d'expert :**\n\n## Analyse technique\nPour les sections principales d'analyse et d'expertise\n\n### 1) Évaluation des sources\nPour l'analyse critique des sources disponibles\n\n### 2) Méthodologie\nPour expliquer l'approche technique utilisée\n\n### 3) Résultats et conclusions\nPour présenter les findings et recommandations\n\n#### - Points clés\nPour les éléments importants à retenir\n\n#### - Recommandations\nPour les conseils d'expert\n\n#### - Limitations\nPour les aspects à considérer avec prudence\n\n**Pour le code technique, utilisez TOUJOURS des blocs de code :**\n```python\n# Code d'exemple technique\ndef analyse_complexe():\n    return \"résultat expert\"\n```\n\n**Pour les formules et équations :**\n```math\nE = mc²\n```\n\n**Pour les tableaux de données techniques :**\n| Paramètre | Valeur | Unité | Source |\n|-----------|--------|-------|--------|\n| Température | 25.5 | °C | Document A |\n| Pression | 1013 | hPa | Document B |\n\n**Pour les listes techniques :**\n- **Critère 1** : Description détaillée\n- **Critère 2** : Description détaillée\n  - Sous-critère 2.1\n  - Sous-critère 2.2\n\n**Pour les citations de sources :**\n> 📄 **Document technique** : \"Citation exacte du document avec référence précise\"\n\n**Pour mettre en évidence du contenu technique :**\n- **Termes techniques** en gras\n- *Concepts clés* en italique\n- `Variables` et `fonctions` en code inline\n- ⚠️ **Avertissements** pour les points critiques\n- ✅ **Validations** pour les confirmations\n\n**EXEMPLE DE STRUCTURE D'EXPERT ATTENDUE :**\n```markdown\n## Analyse technique\n\n### 1) Évaluation des sources\nD'après notre analyse des documents fournis...\n\n#### - Fiabilité des sources\n📄 **Document A** : \"Citation précise sur la fiabilité\"\n\n### 2) Méthodologie\nNotre approche technique s'appuie sur...\n\n```python\ndef methode_expert():\n    # Code de la méthode\n    return resultat\n```\n\n### 3) Résultats et conclusions\n\n#### - Points clés\n- **Point 1** : Description technique détaillée\n- **Point 2** : Description technique détaillée\n\n#### - Recommandations\n> 📄 **Document B** : \"Citation sur les recommandations\"\n\n#### - Limitations\n⚠️ **Attention** : Les limitations identifiées sont...\n```\n\n**IMPORTANT** : Respectez scrupuleusement ce formatage markdown pour toutes vos réponses d'expert. Cela améliore considérablement la lisibilité et la structure de vos analyses techniques.",

      // Limite des messages par défaut (dynamique selon la config)
      GeneralSettings_DefaultDailyMsgLimit: "20",

      // Modèle par défaut pour le speed create
      SpeedCreate_DefaultModel: "gpt-4o-mini",
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await this.set(key, value);
    }

    log(LogLevel.DEBUG, "Paramètres système initialisés avec succès");
  }
}

// 📦 Export singleton instance
export const settingsManager = SettingsManager.getInstance();

// TODO: Ajouter des tests unitaires
// TODO: Implémenter un système de validation des settings
// TODO: Ajouter un système de migration des settings
// TODO: Implémenter un système de backup automatique
// TODO: Ajouter un système de monitoring des performances
