"use client";

import React, { forwardRef } from "react";
import { AccentText } from "./AccentText";
import { presetById } from "@/lib/backgrounds";
import type { Cover, ContentSlide } from "@/lib/types";

export interface SlideView {
  /** "cover" pour la couverture, "content" sinon. */
  kind: "cover" | "content";
  cover?: Cover;
  content?: ContentSlide;
  /** Numéro affiché (2., 3., …) pour les slides de contenu. */
  number?: number;
  /** Dernière slide : affiche l'identifiant et masque la flèche. */
  isLast?: boolean;
  handle?: string;
  /** Identifiant de fond (preset) ou data-URL d'une image téléversée. */
  backgroundId: string;
  imageUrl?: string | null;
}

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ArrowDown = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

/**
 * Un visuel du carrousel, rendu à sa taille native (1080×1350).
 * Le `scale` est appliqué pour l'aperçu ; l'export remet l'échelle à 1.
 */
export const Slide = forwardRef<HTMLDivElement, SlideView & { scale?: number }>(
  function Slide(props, ref) {
    const { kind, scale = 1, backgroundId, imageUrl } = props;

    const bgStyle: React.CSSProperties = imageUrl
      ? { backgroundImage: `url(${imageUrl})` }
      : { background: presetById(backgroundId).css };

    return (
      <div
        ref={ref}
        className="slide"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="slide__bg" style={bgStyle} />
        <div className="slide__veil" />
        <div className="slide__inner">
          {kind === "cover" ? <CoverBody {...props} /> : <ContentBody {...props} />}
        </div>
      </div>
    );
  }
);

function CoverBody({ cover, handle }: SlideView) {
  if (!cover) return null;
  return (
    <>
      <div className="cover__title">
        <AccentText text={cover.title} />
      </div>

      <div className="cover__subtitle">{cover.subtitle}</div>
      <div className="cover__meta">{cover.meta1}</div>
      <div className="cover__meta">{cover.meta2}</div>

      <div className="spacer" />

      <div className="slide__baseline" />
      <div className="slide__footer">
        {handle ? <div className="slide__handle">@{handle}</div> : <span />}
        <div className="arrow">
          <ArrowRight />
        </div>
      </div>
    </>
  );
}

function ContentBody({ content, number, isLast, handle }: SlideView) {
  if (!content) return null;
  return (
    <>
      <div className="slide__num">{number}.</div>

      <div className="content__heading">
        <AccentText text={content.heading} />
      </div>

      <div className="content__rule" />

      {content.source ? (
        <div className="content__source">{content.source}</div>
      ) : null}

      {content.body ? (
        <div className="content__body">{content.body}</div>
      ) : null}

      <div className="spacer" />

      <div className="slide__footer">
        {isLast && handle ? (
          <div className="slide__handle">@{handle}</div>
        ) : (
          <span />
        )}
        <div className="arrow">{isLast ? <ArrowDown /> : <ArrowRight />}</div>
      </div>
    </>
  );
}
