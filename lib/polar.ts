import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

export const POLAR_PRODUCTS = {
  base: {
    monthly: process.env.POLAR_PRODUCT_ID_BASE_MONTHLY,
    yearly: process.env.POLAR_PRODUCT_ID_BASE_YEARLY,
  },
  standard: {
    monthly: process.env.POLAR_PRODUCT_ID_STANDARD_MONTHLY,
    yearly: process.env.POLAR_PRODUCT_ID_STANDARD_YEARLY,
  },
  premium: {
    monthly: process.env.POLAR_PRODUCT_ID_PREMIUM_MONTHLY,
    yearly: process.env.POLAR_PRODUCT_ID_PREMIUM_YEARLY,
  },
};
