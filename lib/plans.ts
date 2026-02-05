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
    credits: 2, // 2 credits for free plan
    tokens: 40000, // 2 credits * 20k = 40,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: 1, // 1 Figma export
    isUnlimited: false,
    features: [
      "2 design credits",
      "1 Figma export",
      "Community support",
      "No credit card required",
    ],
    popular: false,
  },
  base: {
    id: "base",
    name: "Starter",
    // Monthly pricing (75% Welcome Offer)
    price: 499, // INR per month (discounted)
    priceInPaise: 49900,
    originalPrice: 1996, // Original price before 75% discount
    priceUSD: 5, // USD per month (discounted)
    originalPriceUSD: 20, // Original USD price
    // Yearly pricing (75% off + 2 months free)
    yearlyPrice: 4990, // 499 * 10 = 4990
    yearlyPriceInPaise: 499000,
    originalYearlyPrice: 19960, // 1996 * 10
    yearlyPriceUSD: 50, // 5 * 10
    originalYearlyPriceUSD: 200, // 20 * 10
    // Discount
    discountPercent: 75,
    // Credits and tokens
    credits: 20, // 20 credits per month
    tokens: 400000, // 20 credits * 20k = 400,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: 20,
    features: [
      "20 Credits / month",
      "Unlimited projects",
      "20 Figma exports",
      "Basic support",
    ],
    popular: false,
  },
  standard: {
    id: "standard",
    name: "Pro",
    // Monthly pricing (75% Welcome Offer)
    price: 1999, // INR per month (discounted)
    priceInPaise: 199900,
    originalPrice: 7996, // Original price before 75% discount
    priceUSD: 20, // USD per month (discounted)
    originalPriceUSD: 80, // Original USD price
    // Yearly pricing (75% off + 2 months free)
    yearlyPrice: 19990, // 1999 * 10 = 19990
    yearlyPriceInPaise: 1999000,
    originalYearlyPrice: 79960, // 7996 * 10
    yearlyPriceUSD: 200, // 20 * 10
    originalYearlyPriceUSD: 800, // 80 * 10
    // Discount
    discountPercent: 75,
    // Credits and tokens
    credits: 100, // 100 credits per month
    tokens: 2000000, // 100 credits * 20k = 2,000,000 tokens
    projectsLimit: -1, // Unlimited
    figmaLimit: -1, // Unlimited Figma exports
    features: [
      "100 Credits / month",
      "Unlimited projects",
      "Unlimited Figma exports",
      "Priority support",
    ],
    popular: true,
  },
  premium: {
    id: "premium",
    name: "Team",
    // Contact us plan - no fixed pricing
    price: 0,
    priceInPaise: 0,
    originalPrice: 0,
    priceUSD: 0,
    originalPriceUSD: 0,
    yearlyPrice: 0,
    yearlyPriceInPaise: 0,
    originalYearlyPrice: 0,
    yearlyPriceUSD: 0,
    originalYearlyPriceUSD: 0,
    discountPercent: 0,
    // Custom credits and tokens
    credits: -1, // Custom
    tokens: -1, // Custom
    projectsLimit: -1, // Unlimited
    figmaLimit: -1, // Unlimited
    isContactUs: true, // Flag for contact us plan
    features: [
      "Custom Credits",
      "Unlimited projects",
      "Unlimited Figma exports",
      "24/7 Priority support",
      "Team collaboration",
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
