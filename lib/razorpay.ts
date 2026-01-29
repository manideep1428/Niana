// Subscription plans configuration (client-safe)
// Credit System: 1 Credit = 20,000 output tokens

export const TOKENS_PER_CREDIT = 20000;

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceInPaise: 0,
    originalPrice: 0,
    yearlyPrice: 0,
    yearlyPriceInPaise: 0,
    originalYearlyPrice: 0,
    discountPercent: 0,
    credits: -1, // Unlimited credits (Republic Day Offer)
    tokens: -1, // Unlimited tokens (Republic Day Offer)
    projectsLimit: -1, // Unlimited
    figmaLimit: 1, // 1 Figma export (Republic Day Offer)
    isUnlimited: true, // Flag for unlimited plan
    features: [
      "Unlimited Credits",
      "Unlimited projects",
      "Unlimited Figma exports",
      "Community support",
      "No credit card required",
    ],
    popular: false,
  },
  base: {
    id: "base",
    name: "Starter",
    // Monthly pricing
    price: 199, // INR per month
    priceInPaise: 19900,
    originalPrice: 249, // Original price before discount
    // Yearly pricing (20% off = 2 months free, 10 months price)
    yearlyPrice: 1990, // 199 * 10 = 1990 (2 months free)
    yearlyPriceInPaise: 199000,
    originalYearlyPrice: 2388, // 199 * 12 = 2388
    // Discount
    discountPercent: 20,
    // Credits and tokens
    credits: 5, // 5 credits per month
    tokens: 100000, // 5 credits * 20k = 100,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: 5,
    features: [
      "5 Credits / month",
      "Unlimited projects",
      "5 Figma exports",
      "Basic support",
    ],
    popular: false,
  },
  standard: {
    id: "standard",
    name: "Pro",
    // Monthly pricing
    price: 499, // INR per month
    priceInPaise: 49900,
    originalPrice: 624, // Original price before discount
    // Yearly pricing (20% off = 2 months free, 10 months price)
    yearlyPrice: 4990, // 499 * 10 = 4990 (2 months free)
    yearlyPriceInPaise: 499000,
    originalYearlyPrice: 5988, // 499 * 12 = 5988
    // Discount
    discountPercent: 20,
    // Credits and tokens
    credits: 15, // 15 credits per month
    tokens: 300000, // 15 credits * 20k = 300,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: 30,
    features: [
      "15 Credits / month",
      "Unlimited projects",
      "30 Figma exports",
      "Priority support",
    ],
    popular: true,
  },
  premium: {
    id: "premium",
    name: "Enterprise",
    // Monthly pricing
    price: 999, // INR per month
    priceInPaise: 99900,
    originalPrice: 1249, // Original price before discount
    // Yearly pricing (20% off = 2 months free, 10 months price)
    yearlyPrice: 9990, // 999 * 10 = 9990 (2 months free)
    yearlyPriceInPaise: 999000,
    originalYearlyPrice: 11988, // 999 * 12 = 11988
    // Discount
    discountPercent: 20,
    // Credits and tokens
    credits: 50, // 50 credits per month
    tokens: 1000000, // 50 credits * 20k = 1,000,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: 100,
    features: [
      "50 Credits / month",
      "Unlimited projects",
      "100 Figma exports",
      "24/7 Priority support",
      "API access",
    ],
    popular: false,
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;
export type BillingCycle = "monthly" | "yearly";

// Helper function to convert tokens to credits (with 2 decimal places)
export function tokensToCredits(tokens: number): number {
  return Math.round((tokens / TOKENS_PER_CREDIT) * 100) / 100;
}

// Helper function to convert credits to tokens
export function creditsToTokens(credits: number): number {
  return credits * TOKENS_PER_CREDIT;
}
