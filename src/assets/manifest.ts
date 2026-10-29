export type AssetSlot =
  | 'logo'
  | 'logo-light'
  | 'favicon'
  | 'og-image'
  | 'hero'
  | 'about'
  | 'instructor-portrait'
  | `gallery-${1 | 2 | 3 | 4 | 5 | 6}`
  | 'course-cover-default'
  | `partner-${1 | 2 | 3 | 4 | 5 | 6}`;

export interface AssetDefinition {
  src: `/images/${string}`;
  width: number;
  height: number;
}

const imageAsset = (filename: string, width: number, height: number): AssetDefinition => ({
  src: `/images/${filename}`,
  width,
  height,
});

export const assetManifest: Record<AssetSlot, AssetDefinition> = {
  logo: imageAsset('academy-logo.png', 768, 217),
  'logo-light': imageAsset('academy-logo-light.png', 480, 160),
  favicon: imageAsset('favicon.png', 64, 64),
  'og-image': imageAsset('social-card.webp', 1200, 630),
  hero: imageAsset('hero.webp', 1600, 1200),
  about: imageAsset('about.webp', 1200, 900),
  'instructor-portrait': imageAsset('instructor-portrait.webp', 720, 900),
  'gallery-1': imageAsset('gallery-1.webp', 1200, 900),
  'gallery-2': imageAsset('gallery-2.webp', 1200, 900),
  'gallery-3': imageAsset('gallery-3.webp', 1200, 900),
  'gallery-4': imageAsset('gallery-4.webp', 1200, 900),
  'gallery-5': imageAsset('gallery-5.webp', 1200, 900),
  'gallery-6': imageAsset('gallery-6.webp', 1200, 900),
  'course-cover-default': imageAsset('course-cover-default.webp', 1200, 750),
  'partner-1': imageAsset('partner-1.webp', 320, 160),
  'partner-2': imageAsset('partner-2.webp', 320, 160),
  'partner-3': imageAsset('partner-3.webp', 320, 160),
  'partner-4': imageAsset('partner-4.webp', 320, 160),
  'partner-5': imageAsset('partner-5.webp', 320, 160),
  'partner-6': imageAsset('partner-6.webp', 320, 160),
};
