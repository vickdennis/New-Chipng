import React from 'react';
import { Helmet } from 'react-helmet-async';

import { BASE_URL } from '../constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Chip NG - Your Digital Identity Simplified',
  description,
  keywords = ['digital identity', 'bio link', 'networking', 'personal brand'],
  image = 'https://picsum.photos/seed/chipng/1200/630',
  url = BASE_URL,
  type = 'website',
  author = 'Chip NG Team',
  publishedTime,
  modifiedTime
}) => {
  // Smarter defaults
  const finalDescription = description || 'Create your professional digital identity with Chip NG. The smartest way to share your world.';
  const siteTitle = title.includes('Chip NG') ? title : `${title} | Chip NG`;
  const finalImage = image || 'https://picsum.photos/seed/chipng/1200/630';

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content="Chip NG" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:creator" content="@chipng" />

      {/* Article Specific */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? "BlogPosting" : "WebSite",
          "headline": title,
          "description": description,
          "image": image,
          "url": url,
          ...(type === 'article' ? {
            "author": {
              "@type": "Person",
              "name": author
            },
            "datePublished": publishedTime,
            "dateModified": modifiedTime
          } : {})
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
