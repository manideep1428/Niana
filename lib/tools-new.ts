import { Type } from "@google/genai";
import { TOOL_NAMES } from "./tools";

export const geminiTools = [
  {
    functionDeclarations: [
      {
        name: TOOL_NAMES.CREATE_ARTIFACT,
        description: "Create a new UI artifact/screen with HTML content",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description:
                "Unique identifier for the artifact (e.g., 'home-screen', 'login-page')",
            },
            title: {
              type: Type.STRING,
              description:
                "Display title for the artifact according to the html  (eg. 'Home Screen')",
            },
            content: {
              type: Type.STRING,
              description:
                "Complete HTML content for the artifact inline tailwind , no javascript",
            },
          },
          required: ["id", "title", "content"],
        },
      },
      {
        name: TOOL_NAMES.UPDATE_ARTIFACT,
        description: "Update an existing UI artifact/screen with HTML content",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description:
                "Unique identifier for the artifact (e.g., 'home-screen', 'login-page')",
            },
            title: {
              type: Type.STRING,
              description:
                "Display title for the artifact according to the html ",
            },
            content: {
              type: Type.STRING,
              description:
                "Complete HTML content for the artifact inline tailwind , no javascript",
            },
          },
          required: ["id", "title", "content"],
        },
      },
    ],
  },
];
