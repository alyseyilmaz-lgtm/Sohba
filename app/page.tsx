"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Slide, type SlideView } from "@/components/Slide";
import { BACKGROUND_PRESETS, defaultBackgroundId } from "@/lib/backgrounds";
import { DEMO_CAROUSEL } from "@/lib/demo";
import type { Carousel, GenerateOptions } from "@/lib/types";

const PREVIEW_W = 220;
const SCALE = PREVIEW_W / 1080;
const PREVIEW_H = Math.round(1350 * SCALE);

export default function Page() {
  const [sohba, setSohba] = useState("");
  const [opts, setOpts] = useState<GenerateOptions>({
    slideCount: "auto",
    shaykh: "",
    date: "",
    location: "",
    handle: "",
    language: "français",
  });

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [images, setImages] = useState<(string | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_api_key");
    if (saved) setApiKey(saved);

    // Mode démo : ?demo=1 charge un carrousel d'exemple sans appel API.
    if (new URLSearchParams(window.location.search).has("demo")) {
      loadCarousel(DEMO_CAROUSEL, {
        shaykh: "Shaykh Mehmet Ar-Rabbani",
        handle: "as-sadik",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCarousel(c: Carousel, patch?: Partial<GenerateOptions>) {
    if (patch) setOpts((o) => ({ ...o, ...patch }));
    const total = c.slides.length + 1;
    setCarousel(c);
    setBackgrounds(Array.from({ length: total }, (_, i) => defaultBackgroundId(i)));
    setImages(Array.from({ length: total }, () => null));
  }

  function saveKey(v: string) {
    setApiKey(v);
    localStorage.setItem("anthropic_api_key", v);
  }

  // Construit la liste des visuels (couverture + contenus) à partir du carrousel.
  const views: SlideView[] = useMemo(() => {
    if (!carousel) return [];
    const list: SlideView[] = [
      {
        kind: "cover",
        cover: carousel.cover,
        handle: opts.handle,
        backgroundId: backgrounds[0] ?? defaultBackgroundId(0),
        imageUrl: images[0] ?? null,
      },
    ];
    carousel.slides.forEach((s, i) => {
      const idx = i + 1;
      list.push({
        kind: "content",
        content: s,
        number: idx + 1, // la couverture est le visuel 1
        isLast: i === carousel.slides.length - 1,
        handle: opts.handle,
        backgroundId: backgrounds[idx] ?? defaultBackgroundId(idx),
        imageUrl: images[idx] ?? null,
      });
    });
    return list;
  }, [carousel, backgrounds, images, opts.handle]);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-anthropic-key": apiKey } : {}),
        },
        body: JSON.stringify({ sohba, options: opts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération.");
      loadCarousel(data.carousel as Carousel);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  function setBg(index: number, id: string) {
    setBackgrounds((prev) => {
      const next = [...prev];
      next[index] = id;
      return next;
    });
  }

  function onUpload(index: number, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => {
        const next = [...prev];
        next[index] = reader.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  function clearImage(index: number) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  // Rend un visuel en PNG 1080×1350.
  async function renderPng(index: number): Promise<string> {
    const node = slideRefs.current[index];
    if (!node) throw new Error("Visuel introuvable.");
    return toPng(node, {
      width: 1080,
      height: 1350,
      canvasWidth: 1080,
      canvasHeight: 1350,
      pixelRatio: 1,
      cacheBust: true,
      style: { transform: "scale(1)", transformOrigin: "top left", margin: "0" },
    });
  }

  async function downloadOne(index: number) {
    try {
      const url = await renderPng(index);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visuel-${String(index + 1).padStart(2, "0")}.png`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'export.");
    }
  }

  async function downloadZip() {
    setExporting(true);
    setError(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < views.length; i++) {
        const url = await renderPng(i);
        const base64 = url.split(",")[1];
        zip.file(`visuel-${String(i + 1).padStart(2, "0")}.png`, base64, {
          base64: true,
        });
      }
      if (carousel) {
        const tags = carousel.hashtags.map((t) => `#${t}`).join(" ");
        zip.file("legende.txt", `${carousel.description}\n\n${tags}\n`);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "carrousel-sohba.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'export ZIP.");
    } finally {
      setExporting(false);
    }
  }

  function copyCaption() {
    if (!carousel) return;
    const tags = carousel.hashtags.map((t) => `#${t}`).join(" ");
    navigator.clipboard.writeText(`${carousel.description}\n\n${tags}`);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Sohba<span className="dot">.</span> Carrousel
          </h1>
          <p className="app-subtitle">
            Collez une sohba : l'application en retient l'essentiel et compose 5
            à 8 visuels au format Instagram (1080×1350), dans un style sobre et
            esthétique, avec une légende prête à publier.
          </p>
        </div>
      </header>

      <div className="layout">
        {/* ---------------------------------------------------------------- */}
        {/* Colonne gauche : saisie et réglages                              */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <div className="panel">
            <h2>La sohba</h2>
            <label className="field">
              <span>Collez ici le texte de la sohba</span>
              <textarea
                value={sohba}
                onChange={(e) => setSohba(e.target.value)}
                placeholder="Collez la transcription de la sohba du Shaykh…"
              />
            </label>

            <div className="row">
              <label className="field">
                <span>Nombre de visuels</span>
                <select
                  value={String(opts.slideCount)}
                  onChange={(e) =>
                    setOpts({
                      ...opts,
                      slideCount:
                        e.target.value === "auto"
                          ? "auto"
                          : Number(e.target.value),
                    })
                  }
                >
                  <option value="auto">Automatique (5–8)</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </label>
              <label className="field">
                <span>Langue</span>
                <select
                  value={opts.language}
                  onChange={(e) => setOpts({ ...opts, language: e.target.value })}
                >
                  <option value="français">Français</option>
                  <option value="anglais">Anglais</option>
                  <option value="arabe">Arabe</option>
                  <option value="turc">Turc</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Shaykh (attribution)</span>
              <input
                type="text"
                value={opts.shaykh}
                onChange={(e) => setOpts({ ...opts, shaykh: e.target.value })}
                placeholder="Shaykh Mehmet Ar-Rabbani"
              />
            </label>
            <div className="row">
              <label className="field">
                <span>Date / contexte</span>
                <input
                  type="text"
                  value={opts.date}
                  onChange={(e) => setOpts({ ...opts, date: e.target.value })}
                  placeholder="18 mai 2026 - 01 Dhul Hijjah 1447"
                />
              </label>
              <label className="field">
                <span>Lieu</span>
                <input
                  type="text"
                  value={opts.location}
                  onChange={(e) =>
                    setOpts({ ...opts, location: e.target.value })
                  }
                  placeholder="Salat al-Fajr, Akbaba Dergah Istanbul"
                />
              </label>
            </div>
            <label className="field">
              <span>Identifiant Instagram (sans @)</span>
              <input
                type="text"
                value={opts.handle}
                onChange={(e) => setOpts({ ...opts, handle: e.target.value })}
                placeholder="as-sadik"
              />
            </label>

            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={loading || sohba.trim().length < 40}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Génération en cours…
                </>
              ) : (
                "Générer le carrousel"
              )}
            </button>
            {error && <div className="error">{error}</div>}
          </div>

          <div className="panel">
            <h2>Clé API</h2>
            <label className="field">
              <span>Clé Anthropic (stockée localement dans ce navigateur)</span>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => saveKey(e.target.value)}
                placeholder="sk-ant-…"
              />
            </label>
            <button
              className="mini-btn"
              onClick={() => setShowKey((s) => !s)}
              type="button"
            >
              {showKey ? "Masquer" : "Afficher"}
            </button>
            <p className="hint">
              Facultatif si la variable d'environnement{" "}
              <code>ANTHROPIC_API_KEY</code> est définie côté serveur. Sinon,
              collez votre clé ici. Obtenez-la sur console.anthropic.com.
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Colonne droite : aperçu                                          */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {!carousel ? (
            <div className="preview-empty">
              L'aperçu de votre carrousel apparaîtra ici après génération.
            </div>
          ) : (
            <>
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="btn-row">
                  <button
                    className="btn btn-primary"
                    style={{ width: "auto" }}
                    onClick={downloadZip}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <span className="spinner" /> Export…
                      </>
                    ) : (
                      "Télécharger le carrousel (ZIP)"
                    )}
                  </button>
                  <button className="btn btn-ghost" onClick={copyCaption}>
                    Copier la légende
                  </button>
                </div>
              </div>

              <div className="panel" style={{ marginBottom: 20 }}>
                <h2>Légende</h2>
                <div className="caption-box">
                  {carousel.description}
                  <div className="tags">
                    {carousel.hashtags.map((t) => `#${t}`).join(" ")}
                  </div>
                </div>
              </div>

              <div className="slides-grid">
                {views.map((v, i) => (
                  <div className="slide-cell" key={i}>
                    <div className="slide-index">
                      {i === 0 ? "Couverture" : `Visuel ${i + 1}`}
                    </div>
                    <div
                      className="slide-wrap"
                      style={{ width: PREVIEW_W, height: PREVIEW_H }}
                    >
                      <Slide
                        {...v}
                        scale={SCALE}
                        ref={(el) => {
                          slideRefs.current[i] = el;
                        }}
                      />
                    </div>

                    <div className="slide-controls">
                      <select
                        value={images[i] ? "__img" : v.backgroundId}
                        onChange={(e) => setBg(i, e.target.value)}
                        disabled={!!images[i]}
                        title="Fond"
                      >
                        {images[i] && <option value="__img">Photo</option>}
                        {BACKGROUND_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="slide-controls">
                      <label className="mini-btn">
                        Photo…
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => onUpload(i, e.target.files?.[0])}
                        />
                      </label>
                      {images[i] && (
                        <button
                          className="mini-btn"
                          onClick={() => clearImage(i)}
                        >
                          Retirer
                        </button>
                      )}
                      <button
                        className="mini-btn"
                        onClick={() => downloadOne(i)}
                      >
                        PNG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
