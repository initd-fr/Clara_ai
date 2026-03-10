// Types pour les abonnements
export interface SubscriptionConfig {
  id: number;
  name: string;
  description: string | null;
  dailyMessageLimit: number | null;
  storageLimitGB: number | null;
  maxPersonalModels: number | null;
  canCreatePersonalModels: boolean;
  canAccessStoreModels: boolean;
  canAccessTeamFeatures: boolean;
  features: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  bankLabel: string;
  dailyMessageLimit?: number;
  storageLimitGB?: number;
  maxPersonalModels?: number;
  canCreatePersonalModels: boolean;
  canAccessStoreModels: boolean;
  canAccessTeamFeatures: boolean;
  isDefault: boolean;
}

export interface UpdateSubscriptionInput {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  interval?: "month" | "year";
  features?: string[];
  bankLabel?: string;
  dailyMessageLimit?: number;
  storageLimitGB?: number;
  maxPersonalModels?: number;
  canCreatePersonalModels?: boolean;
  canAccessStoreModels?: boolean;
  canAccessTeamFeatures?: boolean;
  isDefault?: boolean;
}

export interface SubscriptionWithDetails extends SubscriptionConfig {
  price?: number;
  interval?: string;
  bankLabel?: string;
  includedClaraModels?: number[];
}

export interface SubscriptionConfigLLM {
  id: number;
  configId: number;
  llmId: number;
  maxOutputTokens: number | null;
  createdAt: Date;
}

export interface UserSubscription {
  id: number;
  userId: string;
  configId: number;
  status: "active" | "canceled" | "past_due";
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  config: SubscriptionConfig;
}
