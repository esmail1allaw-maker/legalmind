const ALLOWED_TAGS = new Set(['B', 'I', 'STRONG', 'EM', 'H3', 'P', 'BR', 'UL', 'OL', 'LI', 'DIV', 'SPAN']);

/** Strip dangerous HTML — allow basic formatting tags only (no attributes). */
export function sanitizeHtml(html: string): string {
  if (!html?.trim()) return '';

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const walk = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent ?? '';
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        const el = node as Element;
        const tag = el.tagName.toUpperCase();
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') return '';
        if (!ALLOWED_TAGS.has(tag)) {
          return Array.from(el.childNodes).map(walk).join('');
        }
        const inner = Array.from(el.childNodes).map(walk).join('');
        if (tag === 'BR') return '<br>';
        return `<${tag.toLowerCase()}>${inner}</${tag.toLowerCase()}>`;
      };
      return Array.from(doc.body.childNodes).map(walk).join('').trim();
    } catch {
      return stripTags(html);
    }
  }

  return stripTags(html);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
