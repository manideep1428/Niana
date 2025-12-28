import { ChatCompletionTool } from "openai/resources/chat/completions";

// Tool definitions for OpenAI function calling
export const tools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "create_artifact",
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
            name: "update_artifact",
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
                        description: "Updated title for the artifact (optional, keeps existing if not provided)",
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

// Type for parsed tool call arguments
export interface CreateArtifactArgs {
    id: string;
    title: string;
    content: string;
}

export interface UpdateArtifactArgs {
    id: string;
    title?: string;
    content: string;
}

export type ToolCallArgs = CreateArtifactArgs | UpdateArtifactArgs;
