export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ProcessStepItem {
  num: string;
  label: string;
  title: string;
  desc?: string;
  paragraphs?: string[];
}

export const SITE_URL = "https://getusranked.com";
export const SITE_NAME = "GetUsRanked";
export const SITE_DESCRIPTION =
  "GetUsRanked builds WordPress & Shopify websites engineered to rank — for search engines and AI engines like ChatGPT & Perplexity from day one.";

/**
 * Returns the central Organization / ProfessionalService Schema.org node
 */
export function getOrganizationSchema() {
  return {
    "@type": ["ProfessionalService", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    image: `${SITE_URL}/favicon.svg`,
    email: "hello@getusranked.com",
    description: SITE_DESCRIPTION,
    priceRange: "$$$",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Worldwide",
    },
    knowsAbout: [
      "GetUsRanked Search Visibility",
      "GetUsRanked SEO Services",
      "Search Engine Optimization (SEO)",
      "Generative Engine Optimization (GEO)",
      "Answer Engine Optimization (AEO)",
      "AI Search Visibility",
      "WordPress Development",
      "Shopify Development",
      "Technical SEO Audits",
      "On-Page SEO",
      "Web Design & Development",
    ],
    sameAs: [
      "https://instagram.com/getusranked",
      "https://facebook.com/getusranked",
      "https://linkedin.com/company/getusranked",
    ],
    hasOfferCatalog: getOfferCatalogSchema(),
  };
}

/**
 * Returns the WebSite Schema.org node
 */
export function getWebsiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

/**
 * Returns the OfferCatalog Schema.org node for agency service packages
 */
export function getOfferCatalogSchema() {
  return {
    "@type": "OfferCatalog",
    name: "Web Design & Search Visibility Packages",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Launch Package",
        description:
          "WordPress or Shopify site, up to 5 pages, on-page SEO foundation, mobile-optimized. Build time ~2-3 weeks.",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          minPrice: "700",
          maxPrice: "1200",
        },
      },
      {
        "@type": "Offer",
        name: "Growth Package",
        description:
          "Up to 10 pages, content system, technical SEO, AI-search (AEO) setup. Build time ~4-5 weeks.",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          minPrice: "1800",
          maxPrice: "3000",
        },
      },
      {
        "@type": "Offer",
        name: "Commerce Package",
        description:
          "Full Shopify store, product SEO, conversion-focused design, AEO/GEO groundwork. Build time ~7-9 weeks.",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          minPrice: "3000",
          maxPrice: "6000",
        },
      },
      {
        "@type": "Offer",
        name: "Enterprise Package",
        description:
          "Custom web applications beyond a standard site: dashboards, booking and scheduling systems, multi-vendor stores, or backend integrations.",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          description: "Custom quote based on project scope",
        },
      },
    ],
  };
}

/**
 * Returns the FAQPage Schema.org node
 */
export function getFaqSchema(faqs: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * Returns the HowTo Schema.org node for agency process
 */
export function getHowToSchema(steps: ProcessStepItem[]) {
  return {
    "@type": "HowTo",
    name: "GetUsRanked Web Design & SEO Process",
    description:
      "Four steps to building sites that rank in Google and AI search engines.",
    step: steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: `${step.num} — ${step.label}`,
      itemListElement: [
        {
          "@type": "HowToDirection",
          text: step.desc || (step.paragraphs ? step.paragraphs.join(" ") : step.title),
        },
      ],
    })),
  };
}

/**
 * Returns the BreadcrumbList Schema.org node
 */
export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Returns a WebPage Schema.org node linked to the site graph
 */
export function getWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
  type?: string;
}) {
  const fullUrl = options.url.startsWith("http")
    ? options.url
    : `${SITE_URL}${options.url}`;

  return {
    "@type": options.type || "WebPage",
    "@id": `${fullUrl}#webpage`,
    url: fullUrl,
    name: options.name,
    description: options.description,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

/**
 * Returns a BlogPosting Schema.org node for individual blog articles
 */
export function getBlogPostingSchema(options: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  authorName?: string;
  category?: string;
}) {
  const fullUrl = options.url.startsWith("http")
    ? options.url
    : `${SITE_URL}${options.url}`;

  return {
    "@type": "BlogPosting",
    "@id": `${fullUrl}#article`,
    isPartOf: {
      "@type": "WebPage",
      "@id": `${fullUrl}#webpage`,
    },
    headline: options.title,
    description: options.description,
    url: fullUrl,
    datePublished: options.datePublished,
    dateModified: options.datePublished,
    mainEntityOfPage: fullUrl,
    articleSection: options.category || "SEO",
    author: {
      "@type": "Organization",
      name: options.authorName || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

/**
 * Creates a combined Schema.org @graph container
 */
export function createGraphSchema(nodes: Record<string, any>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

