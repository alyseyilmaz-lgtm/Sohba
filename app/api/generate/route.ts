import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Carousel, GenerateOptions } from "@/lib/types";
import { buildInstructions } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

// Schéma de sortie structurée : Claude est contraint de renvoyer exactement ce JSON.
const CAROUSEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    cover: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        meta1: { type: "string" },
        meta2: { type: "string" },
      },
      required: ["title", "subtitle", "meta1", "meta2"],
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          source: { type: "string" },
          body: { type: "string" },
        },
        required: ["heading", "source", "body"],
      },
    },
    description: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["cover", "slides", "description", "hashtags"],
} as const;

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || req.headers.get("x-anthropic-key") || "";

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Aucune clé API Anthropic. Renseignez ANTHROPIC_API_KEY dans .env.local, ou collez votre clé dans les réglages.",
      },
      { status: 400 }
    );
  }

  let body: { sohba?: string; options?: GenerateOptions };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const sohba = (body.sohba || "").trim();
  if (sohba.length < 40) {
    return NextResponse.json(
      { error: "Le texte de la sohba est trop court pour en extraire l'essentiel." },
      { status: 400 }
    );
  }

  const options: GenerateOptions = {
    slideCount: body.options?.slideCount ?? "auto",
    shaykh: body.options?.shaykh ?? "",
    date: body.options?.date ?? "",
    location: body.options?.location ?? "",
    handle: body.options?.handle ?? "",
    language: body.options?.language || "français",
  };

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      output_config: { effort: "high", format: { type: "json_schema", schema: CAROUSEL_SCHEMA } },
      system: buildInstructions(options),
      messages: [
        {
          role: "user",
          content: `Voici la sohba à transformer en carrousel :\n\n<sohba>\n${sohba}\n</sohba>`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "La demande a été refusée par le modèle." },
        { status: 422 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Réponse vide du modèle." },
        { status: 502 }
      );
    }

    const carousel = JSON.parse(textBlock.text) as Carousel;
    return NextResponse.json({ carousel });
  } catch (err: unknown) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Clé API invalide." },
        { status: 401 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Limite de requêtes atteinte. Réessayez dans un instant." },
        { status: 429 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erreur inattendue lors de la génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
