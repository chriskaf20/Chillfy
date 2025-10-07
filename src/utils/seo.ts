import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  schemaOrg?: object;
  noIndex?: boolean;
  noFollow?: boolean;
  robots?: string;
}

const defaultSEO: Required<Pick<SEOProps, 'title' | 'description' | 'keywords' | 'author' | 'ogType' | 'twitterCard'>> = {
  title: 'Chillfy - Discover Events in North Cyprus',
  description: 'Find amazing events, concerts, festivals, and gatherings happening in North Cyprus. Your guide to the best entertainment and cultural experiences.',
  keywords: 'North Cyprus events, Cyprus entertainment, concerts, festivals, nightlife, cultural events, TRNC events',
  author: 'Chillfy Team',
  ogType: 'website',
  twitterCard: 'summary_large_image'
};

export function generateSEOMetadata(props: SEOProps = {}): Metadata {
  const {
    title = defaultSEO.title,
    description = defaultSEO.description,
    keywords = defaultSEO.keywords,
    author = defaultSEO.author,
    canonicalUrl,
    ogTitle = title,
    ogDescription = description,
    ogImage = '/chillfy-logo.png',
    ogType = defaultSEO.ogType,
    twitterCard = defaultSEO.twitterCard,
    twitterSite = '@chillfy',
    twitterCreator = '@chillfy',
    noIndex = false,
    noFollow = false,
    robots
  } = props;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chillfy.com';
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;
  const fullOgImage = ogImage?.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  // Build robots directive
  let robotsDirective = '';
  if (robots) {
    robotsDirective = robots;
  } else {
    const directives = [];
    if (noIndex) directives.push('noindex');
    if (noFollow) directives.push('nofollow');
    if (directives.length === 0) directives.push('index', 'follow');
    robotsDirective = directives.join(', ');
  }

  return {
    title,
    description,
    keywords,
    authors: [{ name: author }],
    robots: robotsDirective,
    alternates: {
      canonical: fullCanonicalUrl,
    },
    
    // Open Graph
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: ogType,
      url: fullCanonicalUrl,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        }
      ],
      siteName: 'Chillfy',
      locale: 'en_US',
    },

    // Twitter
    twitter: {
      card: twitterCard,
      site: twitterSite,
      creator: twitterCreator,
      title: ogTitle,
      description: ogDescription,
      images: [fullOgImage],
    },

    // Additional meta tags
    other: {
      'theme-color': '#8b5cf6',
      'msapplication-TileColor': '#8b5cf6',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
    }
  };
}

// Event-specific SEO
export function generateEventSEO(event: {
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  location?: string;
  country?: string;
  image_url?: string;
  poster_image_url?: string;
  price?: number;
  currency?: string;
}): Metadata {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const locationText = [event.venue, event.location, event.country].filter(Boolean).join(', ');
  const priceText = event.price ? ` - From ${event.currency || 'EUR'} ${event.price}` : '';
  
  const title = `${event.title} | ${formattedDate} | Chillfy`;
  const description = event.description || 
    `Join us for ${event.title} on ${formattedDate}${locationText ? ` at ${locationText}` : ''}${priceText}. Book your tickets now on Chillfy!`;

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.date + (event.time ? `T${event.time}` : ''),
    location: event.venue && event.location ? {
      '@type': 'Place',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location,
        addressCountry: event.country || 'CY'
      }
    } : undefined,
    image: event.poster_image_url || event.image_url,
    offers: event.price ? {
      '@type': 'Offer',
      price: event.price,
      priceCurrency: event.currency || 'EUR',
      availability: 'https://schema.org/InStock'
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'Chillfy',
      url: 'https://chillfy.com'
    }
  };

  return generateSEOMetadata({
    title,
    description,
    keywords: `${event.title}, North Cyprus events, ${event.country || event.location || 'Cyprus'} events, ${formattedDate}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: event.poster_image_url || event.image_url,
    ogType: 'article',
    schemaOrg
  });
}

// Blog/Article SEO
export function generateArticleSEO(article: {
  title: string;
  description?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  image?: string;
}): Metadata {
  const keywords = [
    'North Cyprus',
    'events',
    'entertainment',
    ...(article.tags || [])
  ].join(', ');

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author || 'Chillfy Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chillfy',
      logo: {
        '@type': 'ImageObject',
        url: 'https://chillfy.com/chillfy-logo.png'
      }
    },
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    image: article.image
  };

  return generateSEOMetadata({
    title: `${article.title} | Chillfy Blog`,
    description: article.description,
    keywords,
    author: article.author,
    ogTitle: article.title,
    ogDescription: article.description,
    ogImage: article.image,
    ogType: 'article',
    schemaOrg
  });
}

// Profile SEO
export function generateProfileSEO(profile: {
  name: string;
  bio?: string;
  avatar?: string;
  location?: string;
}): Metadata {
  const title = `${profile.name} | Chillfy Profile`;
  const description = profile.bio || 
    `Check out ${profile.name}'s profile on Chillfy${profile.location ? ` from ${profile.location}` : ''}. Discover events they're attending and hosting.`;

  return generateSEOMetadata({
    title,
    description,
    keywords: `${profile.name}, Chillfy profile, North Cyprus events${profile.location ? `, ${profile.location}` : ''}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: profile.avatar,
    ogType: 'profile'
  });
}

// Utility function to generate JSON-LD structured data
export function generateStructuredData(data: object): string {
  return JSON.stringify(data, null, 2);
}

// Organization schema for the site
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Chillfy',
  url: 'https://chillfy.com',
  logo: 'https://chillfy.com/chillfy-logo.png',
  description: 'Your guide to the best events and entertainment in North Cyprus',
  sameAs: [
    'https://facebook.com/chillfy',
    'https://twitter.com/chillfy',
    'https://instagram.com/chillfy'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+90-533-XXX-XXXX',
    contactType: 'customer service',
    areaServed: 'CY',
    availableLanguage: ['English', 'Turkish']
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Kyrenia',
    addressCountry: 'CY'
  }
};

// Website schema
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Chillfy',
  url: 'https://chillfy.com',
  description: 'Find amazing events, concerts, festivals, and gatherings in North Cyprus',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://chillfy.com/events?search={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
};
