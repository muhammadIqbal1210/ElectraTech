import type { MetadataRoute } from 'next';
import { SITE_URL, fetchPublicBlogs } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/kontak`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const blogs = (await fetchPublicBlogs('/api/blogs')) ?? [];
  const blogPages: MetadataRoute.Sitemap = blogs
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(b.slug)}`,
      lastModified: new Date(b.updated_at || b.published_at || b.created_at || now),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages];
}
