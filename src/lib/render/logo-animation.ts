"use client";

import type { LogoSpec } from "@/lib/types";
import { readableOn } from "./color";
import { svgToStandalone } from "./export";
import { renderLogoSvg, type LogoVariant } from "./logo";

// Logo animé : le symbole, le nom et la signature apparaissent l'un après l'autre. Une seule
// description (pistes CSS) sert au SVG animé, lu par tout navigateur, et aux images de la vidéo,
// figées à l'instant voulu (animation en pause, délai négatif).

export type LogoAnimation = "reveal" | "draw" | "bounce";
export const LOGO_ANIMATIONS: LogoAnimation[] = ["reveal", "draw", "bounce"];

/** Fond de l'animation : fond clair de la marque ou aplat de la couleur principale. */
export type AnimationBackground = "light" | "brand";

interface Track {
  selector: string;
  keyframes: string;
  duration: number;
  delay: number;
  easing?: string;
  /** Déclarations propres à la piste (tirets du tracé). */
  extra?: string;
}

const EASE = "cubic-bezier(.2,.8,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

const KEYFRAMES =
  "@keyframes lm-pop{0%{transform:scale(0)}100%{transform:scale(1)}}" +
  "@keyframes lm-fade{from{opacity:0}to{opacity:1}}" +
  "@keyframes lm-zoom{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}" +
  "@keyframes lm-slide{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:translateX(0)}}" +
  "@keyframes lm-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}" +
  "@keyframes lm-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
  "@keyframes lm-drop{0%{opacity:0;transform:translateY(-140px)}55%{opacity:1;transform:translateY(10px)}75%{transform:translateY(-6px)}100%{opacity:1;transform:translateY(0)}}";

const TRACKS: Record<LogoAnimation, Track[]> = {
  reveal: [
    { selector: ".lm-frame", keyframes: "lm-pop", duration: 0.6, delay: 0, easing: SPRING },
    { selector: ".lm-glyph", keyframes: "lm-zoom", duration: 0.5, delay: 0.3 },
    { selector: ".lm-text", keyframes: "lm-slide", duration: 0.7, delay: 0.6 },
    { selector: ".lm-tag", keyframes: "lm-fade", duration: 0.6, delay: 1.1 },
  ],
  draw: [
    { selector: ".lm-frame", keyframes: "lm-fade", duration: 0.5, delay: 0 },
    { selector: ".lm-glyph [pathLength]", keyframes: "lm-draw", duration: 1.3, delay: 0.2, easing: "ease-in-out", extra: "stroke-dasharray:1;" },
    { selector: ".lm-glyph text", keyframes: "lm-fade", duration: 0.8, delay: 0.3 },
    { selector: ".lm-text", keyframes: "lm-rise", duration: 0.7, delay: 1.0 },
    { selector: ".lm-tag", keyframes: "lm-fade", duration: 0.6, delay: 1.4 },
  ],
  bounce: [
    { selector: ".lm-mark", keyframes: "lm-drop", duration: 0.9, delay: 0, easing: "ease-out" },
    { selector: ".lm-text", keyframes: "lm-rise", duration: 0.6, delay: 0.55, easing: SPRING },
    { selector: ".lm-tag", keyframes: "lm-fade", duration: 0.5, delay: 1.0 },
  ],
};

/** Durée de l'animation, en secondes (dernière piste terminée). */
export function animationLength(style: LogoAnimation) {
  return Math.max(...TRACKS[style].map((track) => track.delay + track.duration));
}

/** Feuille de style de l'animation ; `at` fige l'image à cet instant (en secondes). */
function animationCss(style: LogoAnimation, at?: number) {
  const rules = TRACKS[style].map((track) => {
    const delay = at === undefined ? track.delay : track.delay - at;
    const state = at === undefined ? "" : " paused";
    return `${track.selector}{${track.extra ?? ""}animation:${track.keyframes} ${track.duration}s ${track.easing ?? EASE} ${delay.toFixed(3)}s both${state}}`;
  });
  return `.lm-mark,.lm-frame,.lm-glyph,.lm-text,.lm-tag{transform-box:fill-box;transform-origin:center}${KEYFRAMES}${rules.join("")}`;
}

function withStyle(svg: string, css: string) {
  return svg.replace(/(<svg[^>]*>)/, `$1<style>${css}</style>`);
}

function variantFor(spec: LogoSpec, background: AnimationBackground): LogoVariant {
  if (background === "light") return "color";
  return readableOn(spec.colors.primary) === "#ffffff" ? "white" : "black";
}

export function backgroundColor(spec: LogoSpec, background: AnimationBackground) {
  return background === "brand" ? spec.colors.primary : spec.colors.background;
}

/** SVG animé autonome (polices intégrées), prêt pour un site ou une présentation. */
export async function animatedLogoSvg(spec: LogoSpec, style: LogoAnimation, background: AnimationBackground) {
  const { svg, width, height } = renderLogoSvg(spec, { animate: true, variant: variantFor(spec, background), withBackground: false });
  const fill = backgroundColor(spec, background);
  const framed = svg.replace(/(<svg[^>]*>)/, `$1<rect width="${width}" height="${height}" fill="${fill}"/>`);
  return withStyle(await svgToStandalone(framed), animationCss(style));
}

function loadImage(svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image de l'animation illisible"));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

const VIDEO_TYPES = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];

export function videoSupported() {
  return typeof MediaRecorder !== "undefined" && VIDEO_TYPES.some((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Vidéo carrée du logo animé (statut WhatsApp, réseaux sociaux) : chaque image est rendue à
 * l'avance, puis jouée en temps réel devant l'enregistreur du navigateur. MP4 si le navigateur
 * sait l'enregistrer, WebM sinon.
 */
export async function recordLogoVideo(
  spec: LogoSpec,
  style: LogoAnimation,
  background: AnimationBackground,
  options: { size?: number; fps?: number; hold?: number; onProgress?: (ratio: number) => void } = {},
) {
  const { size = 1080, fps = 30, hold = 1.2, onProgress } = options;
  const mimeType = VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("Ce navigateur ne sait pas enregistrer de vidéo");

  const length = animationLength(style) + hold;
  const count = Math.round(length * fps);
  const { svg, width, height } = renderLogoSvg(spec, { animate: true, variant: variantFor(spec, background), withBackground: false });
  const base = await svgToStandalone(svg);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min((size * 0.76) / width, (size * 0.6) / height);
  const [dw, dh] = [width * scale, height * scale];
  const fill = backgroundColor(spec, background);

  const frames: ImageBitmap[] = [];
  try {
    for (let i = 0; i < count; i++) {
      const img = await loadImage(withStyle(base, animationCss(style, i / fps)));
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
      frames.push(await createImageBitmap(canvas));
      onProgress?.((i + 1) / count / 2);
    }

    const recorder = new MediaRecorder(canvas.captureStream(fps), { mimeType, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.start();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        const index = Math.min(count - 1, Math.floor(elapsed * fps));
        ctx.drawImage(frames[index]!, 0, 0);
        onProgress?.(0.5 + Math.min(1, elapsed / length) / 2);
        if (elapsed >= length) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    recorder.stop();
    await stopped;
    return { blob: new Blob(chunks, { type: mimeType.split(";")[0] }), extension: mimeType.startsWith("video/mp4") ? "mp4" : "webm" };
  } finally {
    frames.forEach((frame) => frame.close());
  }
}

/** Image figée de l'animation (aperçu, tests). */
export async function animationFrame(spec: LogoSpec, style: LogoAnimation, background: AnimationBackground, at: number) {
  const { svg } = renderLogoSvg(spec, { animate: true, variant: variantFor(spec, background), withBackground: false });
  return withStyle(await svgToStandalone(svg), animationCss(style, at));
}
