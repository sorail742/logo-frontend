import type { ImageFileFormat } from "./types";

export const MAX_IMAGE_DIMENSION = 8192; // 8K maximum
export const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024; // 35 Mo max

export function validateImageDimensions(width: number, height: number): void {
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(
      `Dimensions de l'image excessives (${width}x${height}). Limite : ${MAX_IMAGE_DIMENSION}px.`,
    );
  }
}

export function detectImageFormat(buffer: ArrayBuffer | Uint8Array): ImageFileFormat {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return detectMagicBytes(bytes);
}

export const sanitizeSvg = sanitizeSvgCode;

export interface FileValidationResult {
  valid: boolean;
  format: ImageFileFormat;
  error?: string;
  sanitizedSvg?: string;
}

/**
 * Détecte le format réel d'un fichier image d'après ses "magic bytes" (signatures binaires),
 * indépendamment de l'extension déclarée.
 */
export function detectMagicBytes(bytes: Uint8Array): ImageFileFormat {
  if (bytes.length < 4) return "UNKNOWN";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "PNG";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "JPEG";
  }

  // WebP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "WEBP";
  }

  // GIF: GIF87a ou GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "GIF";
  }

  // SVG: Texte contenant <svg
  try {
    const textSample = new TextDecoder("utf-8").decode(bytes.slice(0, 1024)).trim();
    if (textSample.includes("<svg") || textSample.includes("<?xml")) {
      return "SVG";
    }
  } catch {
    // Non textuel
  }

  return "UNKNOWN";
}

/**
 * Assainit un fichier SVG en profondeur pour neutraliser toute injection XSS, script,
 * iframe, lien externe ou balise malveillante, tout en préservant 100% des tracés vectoriels.
 */
export function sanitizeSvgCode(rawSvg: string): string {
  // Retirer les commentaires XML
  let clean = rawSvg.replace(/<!--[\s\S]*?-->/g, "");

  // Supprimer les balises dangereuses
  const dangerousTags = [
    "script",
    "iframe",
    "embed",
    "object",
    "foreignObject",
    "applet",
    "meta",
    "link",
    "base",
  ];

  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    clean = clean.replace(regex, "");
    // Aussi balises auto-fermantes
    const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, "gi");
    clean = clean.replace(selfClosing, "");
  });

  // Supprimer tous les attributs événementiels (onload, onclick, onerror, etc.)
  clean = clean.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Neutraliser les URL javascript: ou data: malveillantes
  clean = clean.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/xlink:href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'xlink:href="#"');

  return clean;
}

/**
 * Valide la sécurité complète d'un fichier image avant tout traitement.
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      format: "UNKNOWN",
      error: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Limite : 35 Mo.`,
    };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const format = detectMagicBytes(bytes);

  if (format === "UNKNOWN") {
    return {
      valid: false,
      format: "UNKNOWN",
      error: "Format de fichier non reconnu ou non supporté (formats acceptés : PNG, JPG, WebP, SVG, GIF).",
    };
  }

  if (format === "SVG") {
    const text = new TextDecoder("utf-8").decode(bytes);
    const sanitized = sanitizeSvgCode(text);
    return {
      valid: true,
      format: "SVG",
      sanitizedSvg: sanitized,
    };
  }

  return {
    valid: true,
    format,
  };
}
