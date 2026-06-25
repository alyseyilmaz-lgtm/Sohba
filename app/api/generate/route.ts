import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Carousel, GenerateOptions } from "@/lib/types";

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

function buildSystemPrompt(opts: GenerateOptions): string {
  const count =
    opts.slideCount === "auto"
      ? "entre 5 et 8 visuels au total (couverture comprise)"
      : `${opts.slideCount} visuels au total (couverture comprise)`;

  return `Tu es un éditeur de contenu spécialisé dans la mise en valeur d'enseignements spirituels (sohba) sur Instagram, pour une page sobre, esthétique et soignée.

À partir de la sohba fournie, tu dégages l'essentiel — les points saillants — et tu les organises en un carrousel de ${count}.

Structure attendue :
- "cover" : la couverture.
  - "title" : un titre fort et concis qui résume le message central (2 à 3 lignes courtes max). Utilise des retours à la ligne (\\n) pour répartir le titre sur plusieurs lignes harmonieuses. Mets en accent le ou les mots clés en les entourant de ** (ex : "Rien ne peut remplacer le **Fard**"). 1 à 2 accents maximum.
  - "subtitle" : ligne d'attribution en MAJUSCULES, ex : "ENSEIGNEMENTS DE ${opts.shaykh ? opts.shaykh.toUpperCase() : "SHAYKH …"}".
  - "meta1" : la date / contexte en MAJUSCULES${opts.date ? ` (ex : "${opts.date.toUpperCase()}")` : ""}.
  - "meta2" : le lieu en MAJUSCULES${opts.location ? ` (ex : "${opts.location.toUpperCase()}")` : ""}.
- "slides" : les visuels de contenu (donc ${opts.slideCount === "auto" ? "4 à 7" : Number(opts.slideCount) - 1} éléments, la couverture étant le premier visuel). Chaque visuel :
  - "heading" : une affirmation ou question courte et marquante (1 à 3 lignes). Mets en accent 1 à 3 mots clés avec **.
  - "source" : la référence d'une citation si le point en cite une (ex : "Coran, 89:1-2" ou "Rapporté par al-Bukhârî"). Chaîne vide "" sinon. N'invente JAMAIS une citation ou une source.
  - "body" : 1 à 3 phrases qui développent le point, claires et accessibles.
- "description" : la légende du post (3 à 5 lignes), fidèle au ton sobre et respectueux. Pas de hashtags ici.
- "hashtags" : 5 à 10 hashtags pertinents, SANS le caractère # (juste le mot).

Règles :
- Langue de sortie : ${opts.language}.
- Reste strictement fidèle au contenu de la sohba : ne déforme pas l'enseignement, n'ajoute pas d'opinion, n'invente pas de citations ni de chiffres.
- Respecte l'adab : attribution correcte, ton mesuré, pas de sensationnalisme.
- Style sobre et impactant : phrases courtes, mots justes, pas de remplissage.
- Translittération soignée des termes arabes (ex : Fard, Sunnah, Dhul-Hijjah, ‘ibâda).
- N'utilise ** que pour l'accent couleur, nulle part ailleurs.`;
}

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
      system: buildSystemPrompt(options),
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
