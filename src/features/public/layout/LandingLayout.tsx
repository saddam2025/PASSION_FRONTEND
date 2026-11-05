import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Menu, MessageCircle, Phone, X, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { SplashScreen } from '@/components/common/SplashScreen';
import { RouteTransition } from '@/components/common/motion';

type LandingLink = { id: string; label: string };
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

export function LandingLayout() {
  const { t: tCourses } = useTranslation('courses');
  const { t: tCommon } = useTranslation('common');
  const [links, setLinks] = useState<LandingLink[]>([]);
  const [courseAvailable, setCourseAvailable] = useState(false);
  const [active, setActive] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const refreshLinks = useCallback(() => {
    const next = Array.from(document.querySelectorAll<HTMLElement>('.course-landing [data-landing-section]'))
      .filter((node) => node.dataset.landingType !== 'hero' && node.dataset.landingBackground !== 'hidden')
      .map((node) => {
        const section = node.querySelector<HTMLElement>('.landing-section-frame');
        if (!section?.id) return null;
        const title = section.querySelector<HTMLElement>('h1, h2')?.innerText.trim();
        const label = title?.split(/\s+/).slice(0, 4).join(' ');
        return label ? { id: section.id, label } : null;
      })
      .filter((link): link is LandingLink => Boolean(link));
    setLinks(next.slice(0, 5));
    setActive((current) => current || next[0]?.id || '');
  }, []);

  useEffect(() => {
    const syncAvailability = () => setCourseAvailable(Boolean(document.querySelector('.course-landing')));
    const availabilityObserver = new MutationObserver(syncAvailability);
    availabilityObserver.observe(document.body, { childList: true, subtree: true });
    syncAvailability();
    refreshLinks();
    const observed = new WeakSet<Element>();
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target instanceof HTMLElement) setActive(visible.target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    const sync = () => {
      refreshLinks();
      document.querySelectorAll<HTMLElement>('.course-landing .landing-section-frame[id]').forEach((section) => {
        if (!observed.has(section)) { observer?.observe(section); observed.add(section); }
      });
    };
    const mutations = new MutationObserver(sync);
    mutations.observe(document.body, { childList: true, subtree: true });
    sync();
    return () => { mutations.disconnect(); observer?.disconnect(); availabilityObserver.disconnect(); };
  }, [refreshLinks]);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.course-landing-navbar');
    const update = () => header?.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const socialLinks = [
    { label: 'فيسبوك', href: 'https://www.facebook.com/coachpassacad', icon: <Facebook size={20} aria-hidden="true" /> },
    { label: 'إنستجرام', href: 'https://www.instagram.com/coachpassacad', icon: <Instagram size={20} aria-hidden="true" /> },
    { label: 'يوتيوب', href: 'https://www.youtube.com/@coachpassacad', icon: <Youtube size={20} aria-hidden="true" /> },
    { label: 'لينكدإن', href: 'https://www.linkedin.com/in/coachpassacad', icon: <Linkedin size={20} aria-hidden="true" /> },
    { label: 'X', href: 'https://x.com/coachpassacad', icon: <span className="course-landing-x-icon" aria-hidden="true">𝕏</span> },
  ];

  return <div className="course-landing-shell">
    <SplashScreen />
    {courseAvailable && <header className="course-landing-navbar" data-scrolled="false">
      <div className="course-landing-navbar-inner">
        <a className="course-landing-brand" href="#main-content" aria-label="Passion">
          <SmartImage slot="logo" alt="Passion" width={240} height={80} className="object-contain" />
        </a>
        <nav className="course-landing-nav-links" aria-label={tCommon('courses')}>
          {links.map((link) => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? 'location' : undefined} onClick={(event) => { event.preventDefault(); scrollTo(link.id); }}>{link.label}</a>)}
        </nav>
        <button type="button" className="course-landing-register" onClick={() => scrollTo('register')}>{tCourses('register')}</button>
        <button type="button" className="course-landing-menu-toggle" aria-label={menuOpen ? tCommon('close') : tCommon('courses')} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        {menuOpen && <nav className="course-landing-menu" aria-label={tCommon('courses')}>
          {links.map((link) => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? 'location' : undefined} onClick={(event) => { event.preventDefault(); setMenuOpen(false); scrollTo(link.id); }}>{link.label}</a>)}
        </nav>}
      </div>
    </header>}
    <main id="main-content" className="course-landing-main"><RouteTransition><Outlet /></RouteTransition></main>
    {courseAvailable && <footer className="course-landing-footer">
      <div className="course-landing-footer-inner">
        <section className="course-landing-footer-contact">
          <h2>تواصل معانا</h2>
          <div className="course-landing-footer-links">
            <a href="mailto:info@coachpassacad.com"><Mail size={20} aria-hidden="true" /><bdi dir="ltr">info@coachpassacad.com</bdi></a>
            <a href="https://wa.me/201094700533" target="_blank" rel="noreferrer"><MessageCircle size={20} aria-hidden="true" /><span>واتساب: <bdi dir="ltr">+201094700533</bdi></span></a>
            <a href="tel:+201068299533"><Phone size={20} aria-hidden="true" /><span>هاتف: <bdi dir="ltr">+201068299533</bdi></span></a>
          </div>
        </section>
        <section className="course-landing-footer-social">
          <h2>تابعنا على</h2>
          <nav className="course-landing-social-grid" aria-label="تابعنا على المنصات الاجتماعية">
            {socialLinks.map(({ label, href, icon }) => <a key={label} href={href} target="_blank" rel="noreferrer">{icon}<span>تابعنا على {label}</span></a>)}
          </nav>
        </section>
      </div>
    </footer>}
  </div>;
}
