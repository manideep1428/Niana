import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: "polar_oat_nPNmGXesHxrQhDg1NWdOaFVNTVHCAM6rqax8B4MyBBw",
  server: "production",
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
