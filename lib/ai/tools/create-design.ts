import { tool } from "ai";
import { z } from "zod";

export const createDesignTool = tool({
  description:
    "Create a new HTML design/artifact for mobile UI. Use this when the user asks to create a new screen, page, or component. Each design gets a unique ID.",
  parameters: z.object({
    id: z
      .string()
      .describe(
        "Unique kebab-case identifier for this design (e.g., 'login-page', 'home-dashboard'). Must be unique across the project."
      ),
    title: z
      .string()
      .describe(
        "Human-readable title for the design (e.g., 'Login Page', 'Home Dashboard')"
      ),
    content: z
      .string()
      .describe(
        "Complete HTML content including DOCTYPE, html, head (with Tailwind CSS, Font Awesome, Google Fonts imports), and body. Must be a valid, complete HTML file."
      ),
  }),
  execute: async ({ id, title, content }) => {
    // Tool execution is handled by the API route
    // This just returns the data for streaming
    return {
      id,
      title,
      content,
      message: `Created design "${title}"`,
    };
  },
});
