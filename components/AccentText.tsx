import React from "react";

/**
 * Rend un texte où les segments entourés de ** sont colorés avec l'accent.
 * Les retours à la ligne sont conservés.
 * Ex : "Rien ne peut remplacer le **Fard**" → "Fard" en bleu.
 */
export function AccentText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span className="accent" key={i}>
              {part.slice(2, -2)}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
