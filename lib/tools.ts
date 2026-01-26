import { ChatCompletionTool } from "openai/resources/chat/completions";

// Export tool types
export type CreateArtifactArgs = {
  id: string;
  title: string;
  content: string;
};

export type UpdateArtifactArgs = {
  id: string;
  title?: string;
  content: string;
};

export type ToolCallArgs = CreateArtifactArgs | UpdateArtifactArgs;

export const TOOL_NAMES = {
  CREATE_ARTIFACT: "createArtifact",
  UPDATE_ARTIFACT: "updateArtifact",
} as const;

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: TOOL_NAMES.CREATE_ARTIFACT,
      description:
        "Create a new HTML artifact for mobile UI design. Use this when the user asks to create a new screen, page, or component. Each artifact gets a unique ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Unique kebab-case identifier for this artifact (e.g., 'login-page', 'home-dashboard'). Must be unique across the project.",
          },
          title: {
            type: "string",
            description:
              "Human-readable title for the artifact (e.g., 'Login Page', 'Home Dashboard')",
          },
          content: {
            type: "string",
            description:
              "Complete HTML content including DOCTYPE, html, head (with Tailwind CSS, Font Awesome, Google Fonts imports), and body. Must be a valid, complete HTML file.",
          },
        },
        required: ["id", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.UPDATE_ARTIFACT,
      description:
        "Update an existing HTML artifact. Use this when the user asks to modify, improve, or change an existing screen that was previously created.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The ID of the existing artifact to update. Must match an artifact that was previously created.",
          },
          title: {
            type: "string",
            description:
              "Updated title for the artifact (optional, keeps existing if not provided)",
          },
          content: {
            type: "string",
            description:
              "Updated complete HTML content. Must be a valid, complete HTML file with all imports.",
          },
        },
        required: ["id", "content"],
      },
    },
  },
];

// Helper to check if a tool call is for creating an artifact
export function isCreateArtifactCall(name: string): boolean {
  return name === TOOL_NAMES.CREATE_ARTIFACT;
}

// Helper to check if a tool call is for updating an artifact
export function isUpdateArtifactCall(name: string): boolean {
  return name === TOOL_NAMES.UPDATE_ARTIFACT;
}

// Get tool by name
export function getToolByName(name: string): ChatCompletionTool | undefined {
  return tools.find(
    (tool) => tool.type === "function" && tool.function.name === name,
  );
}
