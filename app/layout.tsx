import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Police proche du design des posts : sans-serif géométrique, graisses lourdes.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sohba — Générateur de carrousels",
  description:
    "Transformez une sohba en carrousel Instagram : extraction des points essentiels et mise en page sobre et esthétique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
