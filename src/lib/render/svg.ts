export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FORBIDDEN_TAGS = ["script", "foreignObject", "iframe", "object", "embed", "audio", "video", "use"];

/**
 * Nettoie un SVG importé (§14.1) : supprime scripts, gestionnaires d'événements, liens externes
 * et foreignObject. L'API refait ce nettoyage côté serveur ; celui-ci protège l'aperçu.
 */
export function sanitizeSvg(source: string): string | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return null;

  for (const tag of FORBIDDEN_TAGS) {
    doc.querySelectorAll(tag).forEach((node) => node.remove());
  }
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = root;
  while (node) {
    const element = node as Element;
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      const isLink = name === "href" || name === "xlink:href" || name === "src";
      if (name.startsWith("on")) element.removeAttribute(attr.name);
      else if (isLink && !value.startsWith("#") && !value.startsWith("data:image/")) element.removeAttribute(attr.name);
      else if (value.includes("javascript:")) element.removeAttribute(attr.name);
      else if (name === "style" && /url\(\s*['"]?(?!#)/.test(value)) element.removeAttribute(attr.name);
    }
    node = walker.nextNode();
  }
  return new XMLSerializer().serializeToString(root);
}

let counter = 0;
export function uid(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}
