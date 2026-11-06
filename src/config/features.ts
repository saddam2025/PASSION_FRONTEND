export interface FeatureFlags {
  /** Restores the public marketing home at /ar. */
  PUBLIC_HOME_ENABLED: boolean;
  /** Restores the public course catalog at /ar/courses. */
  PUBLIC_CATALOG_ENABLED: boolean;
  /** Restores the public navbar, footer, and bottom navigation. */
  PUBLIC_SHELL_ENABLED: boolean;
  /** Restores the standalone public registration confirmation page. */
  PUBLIC_CONFIRMATION_PAGE_ENABLED: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  PUBLIC_HOME_ENABLED: false,
  PUBLIC_CATALOG_ENABLED: false,
  PUBLIC_SHELL_ENABLED: false,
  PUBLIC_CONFIRMATION_PAGE_ENABLED: false,
};

/** When enabled, Meta Pixel stays off until the visitor accepts the consent banner. */
export const META_PIXEL_REQUIRES_CONSENT = false;
