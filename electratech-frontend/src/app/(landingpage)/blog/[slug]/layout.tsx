import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ORG_ID, SITE_NAME, SITE_URL, absoluteUrl, fetchBlogBySlug, toExcerpt } from '@/lib/site';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

/** null = API tidak bisa dihubungi (halaman client tetap mencoba memuat). */
async function getBlog(slug: string) {
  const result = await fetchBlogBySlug(slug);
  if (result === 'not-found') notFound();
  return result;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  const canonical = `/blog/${encodeURIComponent(slug)}`;

  if (!blog) {
    return { title: { absolute: `Berita | ${SITE_NAME}` }, alternates: { canonical } };
  }

  const description = toExcerpt(blog.content) || `${blog.title} – ${SITE_NAME}`;
  const image = absoluteUrl(blog.thumbnail);

  return {
    title: { absolute: `${blog.title} | ${SITE_NAME}` },
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
