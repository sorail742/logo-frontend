// Préparation des photos importées dans le navigateur : réduites (2 400 px au plus sur le grand
// côté, assez pour un A4 à 200 dpi), en JPEG si elles sont opaques, en PNG si elles ont de la
// transparence, et sous la limite de poids d'une image du document (4 Mo, comme l'API).

const MAX_SIDE = 2400;
const MAX_BYTES = 4 * 1024 * 1024;

export interface PreparedImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

async function decode(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 16) if (data[i]! < 250) return true;
  return false;
}

const bytesOf = (dataUrl: string) => Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

/** `maxSide` : côté maximal (impression textile à 300 dpi : davantage que pour une page). */
export async function prepareImage(file: Blob, options: { maxSide?: number } = {}): Promise<PreparedImage> {
  const img = await decode(file);
  let scale = Math.min(1, (options.maxSide ?? MAX_SIDE) / Math.max(img.naturalWidth, img.naturalHeight));
  for (let attempt = 0; attempt < 6; attempt++) {
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    const alpha = file.type !== "image/jpeg" && hasTransparency(ctx, width, height);
    const src = alpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.86);
    if (bytesOf(src) <= MAX_BYTES) return { src, naturalWidth: width, naturalHeight: height };
    scale *= 0.75;
  }
  throw new Error("Image trop lourde");
}

/** Images d'un presse-papiers ou d'un dépôt. */
export function imageFiles(list: FileList | DataTransferItemList | File[]) {
  const files: File[] = [];
  for (const item of Array.from(list as ArrayLike<File | DataTransferItem>)) {
    const file = item instanceof File ? item : item.kind === "file" ? item.getAsFile() : null;
    if (file && /^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) files.push(file);
  }
  return files;
}
