import type { Metadata } from 'next';
import { ORG_ID, SITE_NAME, SITE_URL, absoluteUrl, fetchPublicBlogs, toExcerpt, type PublicBlogPost } from '@/lib/site';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

function getBlog(slug: string) {
  return fetchPublicBlogs<PublicBlogPost>(`/api/blogs/${encodeURIComponent(slug)}`);
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  const canonical = `/blog/${encodeURIComponent(slug)}`;

  if (!blog) {
    return { title: 'Artikel tidak ditemukan', robots: { index: false, follow: true }, alternates: { canonical } };
  }

  const description = toExcerpt(blog.content) || `${blog.title} – ${SITE_NAME}`;
  const image = absoluteUrl(blog.thumbnail);

  return {
    title: blog.title,
    description,
    alternates: { canonical },
    authors: blog.author_name ? [{ name: blog.author_name }] : undefined,
    openGraph: {
      type: 'article',
      title: blog.title,
      description,
      url: canonical,
      publishedTime: blog.published_at || blog.created_at,
      modifiedTime: blog.updated_at,
      authors: blog.author_name ? [blog.author_name] : undefined,
      section: blog.category,
      ...(image ? { images: [{ url: image, alt: blog.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function BlogDetailLayout({ params, children }: Props) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  const jsonLd = blog
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: toExcerpt(blog.content),
        image: absoluteUrl(blog.thumbnail),
        datePublished: blog.published_at || blog.created_at,
        dateModified: blog.updated_at || blog.published_at || blog.created_at,
        author: blog.author_name ? { '@type': 'Person', name: blog.author_name } : undefined,
        publisher: { '@id': ORG_ID },
        mainEntityOfPage: `${SITE_URL}/blog/${encodeURIComponent(slug)}`,
        articleSection: blog.category,
        inLanguage: 'id-ID',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      )}
      {children}
    </>
  );
}
