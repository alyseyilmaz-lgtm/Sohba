import type { GenerateOptions } from "./types";

// Instructions communes au mode automatique (API) et au mode manuel (claude.ai).
export function buildInstructions(opts: GenerateOptions): string {
  const count =
    opts.slideCount === "auto"
      ? "entre 5 et 8 visuels au total (couverture comprise)"
      : `${opts.slideCount} visuels au total (couverture comprise)`;

  const contentCount =
    opts.slideCount === "auto" ? "4 à 7" : `${Number(opts.slideCount) - 1}`;

  return `Tu es un éditeur de contenu spécialisé dans la mise en valeur d'enseignements spirituels (sohba) sur Instagram, pour une page sobre, esthétique et soignée.

À partir de la sohba fournie, tu dégages l'essentiel — les points saillants — et tu les organises en un carrousel de ${count}.

Structure attendue :
- "cover" : la couverture.
  - "title" : un titre fort et concis qui résume le message central (2 à 3 lignes courtes max). Utilise des retours à la ligne (\\n) pour répartir le titre sur plusieurs lignes harmonieuses. Mets en accent le ou les mots clés en les entourant de ** (ex : "Rien ne peut remplacer le **Fard**"). 1 à 2 accents maximum.
  - "subtitle" : ligne d'attribution en MAJUSCULES, ex : "ENSEIGNEMENTS DE ${opts.shaykh ? opts.shaykh.toUpperCase() : "SHAYKH …"}".
  - "meta1" : la date / contexte en MAJUSCULES${opts.date ? ` (ex : "${opts.date.toUpperCase()}")` : ""}.
  - "meta2" : le lieu en MAJUSCULES${opts.location ? ` (ex : "${opts.location.toUpperCase()}")` : ""}.
- "slides" : les visuels de contenu (donc ${contentCount} éléments, la couverture étant le premier visuel). Chaque visuel :
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

// Forme JSON décrite explicitement pour le mode manuel (claude.ai n'impose pas de schéma).
export const JSON_SHAPE = `{
  "cover": { "title": "…", "subtitle": "…", "meta1": "…", "meta2": "…" },
  "slides": [
    { "heading": "…", "source": "…", "body": "…" }
  ],
  "description": "…",
  "hashtags": ["…", "…"]
}`;

// Invite complète à copier dans claude.ai (mode manuel, gratuit).
export function buildManualPrompt(sohba: string, opts: GenerateOptions): string {
  return `${buildInstructions(opts)}

IMPORTANT : réponds UNIQUEMENT avec un objet JSON valide correspondant exactement à cette structure, sans aucun texte avant ou après, et sans bloc de code (pas de \`\`\`) :
${JSON_SHAPE}

Voici la sohba à transformer en carrousel :
<sohba>
${sohba}
</sohba>`;
}
