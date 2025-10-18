export type SectionType =
  | "hero"
  | "features"
  | "cta"
  | "pricing"
  | "faq"
  | "testimonials"
  | "gallery"
  | "stats"
  | "contact"
  | "footer";

export interface SiteMedia {
  kind: "image" | "video";
  prompt: string;
  alt: string;
  url?: string;
}

export type ActionStyle = "primary" | "secondary" | "ghost";

export interface SiteAction {
  label: string;
  href: string;
  style?: ActionStyle;
}

export interface SectionItem {
  title: string;
  description?: string;
  icon?: string;
  href?: string;
  stats?: Record<string, string | number>;
}

export interface SectionMetadata {
  layout?: "grid" | "list" | "carousel";
  ariaLabel?: string;
  background?: "default" | "muted" | "accent";
}

export interface SiteSection {
  id: string;
  type: SectionType;
  headline: string;
  subhead?: string;
  body?: string;
  media?: SiteMedia[];
  actions?: SiteAction[];
  items?: SectionItem[];
  metadata?: SectionMetadata;
}

export interface SitePage {
  route: string;
  title: string;
  description?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  sections: SiteSection[];
}

export interface SitePalette {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
}

export interface SiteInfo {
  name: string;
  description: string;
  locale: string;
  palette: SitePalette;
}

export interface SiteJSON {
  version: string;
  site: SiteInfo;
  pages: SitePage[];
}
