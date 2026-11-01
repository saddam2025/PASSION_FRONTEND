import { useEffect } from 'react';
interface SeoOptions {
  title: string;
  description: string;
  language?: 'ar' | 'en';
  canonical?: string;
  image?: string;
  robots?: string;
}
function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement('meta');
    if (property) node.setAttribute('property', name);
    else node.name = name;
    document.head.append(node);
  }
  node.content = content;
}
// Client-side metadata is temporary; B6 will inject the public تحسين محركات البحث metadata on the server.
export function useSeo({
  title,
  description,
  canonical,
  image = '/images/social-card.webp',
  robots = 'index,follow',
}: SeoOptions) {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('robots', robots);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', canonical ?? `${window.location.origin}${window.location.pathname}`, true);
    setMeta('og:type', 'website', true);
    setMeta('og:locale', 'ar_EG', true);
    setMeta('twitter:card', 'summary_large_image');
    const base = window.location.origin;
    const href = canonical ?? `${base}${window.location.pathname}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.append(link);
    }
    link.href = href;
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
  }, [title, description, canonical, image, robots]);
}
