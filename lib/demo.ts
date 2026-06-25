import type { Carousel } from "./types";

// Exemple de carrousel pour prévisualiser la mise en page sans appel API.
// Accessible via ?demo=1.
export const DEMO_CAROUSEL: Carousel = {
  cover: {
    title: "Rien ne peut\nremplacer le **Fard**",
    subtitle: "ENSEIGNEMENTS DE SHAYKH MEHMET AR-RABBANI",
    meta1: "18 MAI 2026 - 01 DHUL HIJJAH 1447",
    meta2: "SALAT AL-FAJR, AKBABA DERGAH ISTANBUL",
  },
  slides: [
    {
      heading: "« Par l'aube ! Et par les **dix nuits** ! »",
      source: "Coran, 89:1-2",
      body: "Allah ‘Azza wa-Jalla honore les dix premiers jours de Dhul Hijjah en jurant par eux, afin que Ses serviteurs gagnent plus de récompenses.",
    },
    {
      heading: "Aujourd'hui commence le mois de **Dhul-Hijjah** !",
      source: "",
      body: "Jeûner durant ces jours est une Sunnah, un cadeau d'Allah. C'est une très bonne action dont la récompense est immense.",
    },
    {
      heading:
        "Certaines personnes confondent les **actes obligatoires** et les **actes prophétiques**.",
      source: "",
      body: "Ils négligent le Fard et accomplissent la Sunnah à la place.",
    },
    {
      heading:
        "**Aucune** action Sunnah ne peut remplacer une action Fard !",
      source: "",
      body: "Accomplissez d'abord l'obligation. Si vous accomplissez ensuite la Sunnah, vous aurez gagné deux fois.",
    },
  ],
  description:
    "Les dix premiers jours de Dhul Hijjah sont parmi les plus aimés d'Allah. Profitons-en pour multiplier les bonnes actions — mais sans jamais négliger nos obligations. La Sunnah élève ; le Fard demeure la priorité.",
  hashtags: [
    "DhulHijjah",
    "Tariqa",
    "Adab",
    "Sohba",
    "Islam",
    "Spiritualité",
    "Fard",
    "Sunnah",
  ],
};
