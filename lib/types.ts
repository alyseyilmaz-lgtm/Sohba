// Modèle de données partagé entre l'API d'extraction et l'interface.

export interface Cover {
  /** Titre de couverture. Les mots à mettre en avant sont entourés de **. */
  title: string;
  /** Sous-titre en majuscules, ex : "ENSEIGNEMENTS DE SHAYKH ...". */
  subtitle: string;
  /** Ligne d'info 1 (date). */
  meta1: string;
  /** Ligne d'info 2 (lieu). */
  meta2: string;
}

export interface ContentSlide {
  /** Titre du point. Les mots clés sont entourés de ** pour l'accent couleur. */
  heading: string;
  /** Source d'une citation (Coran, hadith…). Chaîne vide si absente. */
  source: string;
  /** Texte explicatif (1 à 3 phrases). */
  body: string;
}

export interface Carousel {
  cover: Cover;
  slides: ContentSlide[];
  /** Légende du post (quelques lignes). */
  description: string;
  /** Hashtags pertinents, sans le # (ajouté à l'affichage). */
  hashtags: string[];
}

export interface GenerateOptions {
  /** Nombre total de visuels souhaité (5 à 8), couverture incluse. */
  slideCount: number | "auto";
  /** Nom du Shaykh pour l'attribution. */
  shaykh: string;
  /** Date / contexte. */
  date: string;
  /** Lieu. */
  location: string;
  /** Identifiant Instagram (sans @). */
  handle: string;
  /** Langue de sortie. */
  language: string;
}
