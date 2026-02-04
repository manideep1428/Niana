import { tool } from "ai";
import { z } from "zod";

export const updateDesignTool = tool({
  description:
    "Update an existing HTML design/artifact. Use this when the user asks to modify, improve, or change an existing screen that was previously created.",
  parameters: z.object({
    id: z
      .string()
      .describe(
        "The ID of the existing design to update. Must match a design that was previously created."
      ),
    title: z
      .string()
      .optional()
      .describe(
        "Updated title for the design (optional, keeps existing if not provided)"
      ),
    content: z
      .string()
      .describe(
        "Updated complete HTML content. Must be a valid, complete HTML file with all imports."
      ),
  }),
  execute: async ({ id, title, content }) => {
    // Tool execution is handled by the API route
    // This just returns the data for streaming
    return {
      id,
      title,
      content,
      message: `Updated design "${title || id}"`,
    };
  },
});
