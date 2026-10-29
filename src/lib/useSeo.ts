import { useEffect } from 'react';
interface SeoOptions {
  title: string;
  description: string;
  language: 'ar' | 'en';
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
// Client-side metadata is temporary; B6 will inject the public SEO metadata on the server.
export function useSeo({
  title,
  description,
  language,
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
    setMeta('og:locale', language === 'ar' ? 'ar_EG' : 'en_US', true);
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
    const alternates: HTMLLinkElement[] = [];
    for (const lang of ['ar', 'en'] as const) {
      const item = document.createElement('link');
      item.rel = 'alternate';
      item.hreflang = lang;
      item.href = `${base}${window.location.pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${lang}`)}`;
      document.head.append(item);
      alternates.push(item);
    }
    return () => alternates.forEach((x) => x.remove());
  }, [title, description, language, canonical, image, robots]);
}
