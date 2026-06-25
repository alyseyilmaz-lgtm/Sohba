// Fonds sobres par défaut (dégradés profonds et élégants).
// Chaque visuel reçoit un fond ; l'utilisateur peut aussi téléverser une photo.

export interface BackgroundPreset {
  id: string;
  label: string;
  /** Valeur CSS de `background`. */
  css: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "teal", label: "Sarcelle nuit", css: "linear-gradient(160deg, #0c2b34 0%, #061419 100%)" },
  { id: "charcoal", label: "Anthracite", css: "linear-gradient(160deg, #24272d 0%, #0d0e11 100%)" },
  { id: "dusk", label: "Crépuscule", css: "linear-gradient(160deg, #3a2a22 0%, #130c09 100%)" },
  { id: "slate", label: "Bleu ardoise", css: "linear-gradient(160deg, #1b2a3a 0%, #090f15 100%)" },
  { id: "olive", label: "Olive nuit", css: "linear-gradient(160deg, #2a2e22 0%, #0f110b 100%)" },
  { id: "plum", label: "Prune profonde", css: "linear-gradient(160deg, #2c2230 0%, #100b12 100%)" },
];

export function presetById(id: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((p) => p.id === id) ?? BACKGROUND_PRESETS[0];
}

/** Attribue un fond par défaut en faisant tourner la palette. */
export function defaultBackgroundId(index: number): string {
  return BACKGROUND_PRESETS[index % BACKGROUND_PRESETS.length].id;
}
