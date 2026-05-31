import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Dutch Flashcards API",
    version: "1.0.0",
    description: "Agent-friendly REST API for Dutch vocabulary flashcards",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  paths: {
    "/cards": {
      get: {
        summary: "List flashcards",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "focusOnly", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: { "200": { description: "List of cards" } },
      },
      post: {
        summary: "Create a flashcard",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["dutchWord"],
                properties: {
                  dutchWord: { type: "string" },
                  imageUrl: { type: "string", format: "uri" },
                  generate: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/cards/bulk": {
      post: {
        summary: "Bulk create flashcards",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  words: { type: "array", items: { type: "string" } },
                  cards: { type: "array", items: { type: "object" } },
                  options: { type: "object" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Bulk result" } },
      },
    },
    "/cards/focus": {
      get: {
        summary: "List focus words by priority",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "Focus cards" } },
      },
    },
    "/cards/{id}": {
      get: { summary: "Get card by ID" },
      put: { summary: "Replace card" },
      patch: { summary: "Partial update" },
      delete: { summary: "Delete card" },
    },
    "/test/session": {
      post: {
        summary: "Start adaptive test session",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  mode: { type: "string", enum: ["focus", "weak-only", "new-only", "full"] },
                  count: { type: "integer" },
                  types: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    "/test/grade": {
      post: { summary: "Grade a test answer and update mastery" },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
  },
  security: [{ bearerAuth: [] }],
};

export async function GET() {
  return NextResponse.json(spec);
}
