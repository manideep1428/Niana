// Model types for Niana
export type ModelTier = "free" | "pro";

export type ChatModel = {
  id: string;
  name: string;
  tier: ModelTier;
  description: string;
  requiresSubscription: boolean;
};

export const chatModels: ChatModel[] = [
  {
    id: "free",
    name: "Free Model",
    tier: "free",
    description: "Fast and free for all users",
    requiresSubscription: false,
  },
  {
    id: "pro",
    name: "Pro Model",
    tier: "pro",
    description: "Advanced model for subscribers only",
    requiresSubscription: true,
  },
];

export const DEFAULT_MODEL = "free";

// Get model by ID
export function getModelById(id: string): ChatModel | undefined {
  return chatModels.find((model) => model.id === id);
}

// Check if model requires subscription
export function modelRequiresSubscription(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.requiresSubscription ?? false;
}
