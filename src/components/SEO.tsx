import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BASE_URL } from '../constants';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Chip NG - The ultimate link-in-bio platform for creators and businesses.", 
  image = "https://chipng.com/og-image.png", // Fallback OG image
  url,
  type = 'website',
  author = 'Chip NG',
  publishedTime,
  modifiedTime,
  keywords = ['chip ng', 'link in bio', 'creator tools', 'bio link', 'social media marketing']
}) => {
  const siteTitle = `${title} | Chip NG`;
  const canonicalUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'BlogPosting' : type === 'profile' ? 'ProfilePage' : 'WebPage',
          "headline": title,
          "description": description,
          "image": image,
          "url": canonicalUrl,
          ...(type === 'article' && {
            "author": {
              "@type": "Person",
              "name": author
            },
            "datePublished": publishedTime,
            "dateModified": modifiedTime
          })
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
