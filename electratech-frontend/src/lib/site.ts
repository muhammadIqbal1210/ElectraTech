import { API_URL } from '@/lib/api';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfarm.electratech.id').replace(/\/$/, '');
/** Nama produk/subdomain ini — sengaja dibedakan dari web utama agar tidak bersaing di hasil pencarian. */
export const SITE_NAME = 'SmartFarm Electra Tech';

/** Web utama perusahaan (induk). */
export const ORG_NAME = 'Electra Tech';
export const ORG_URL = 'https://electratech.id';
export const ORG_ID = `${ORG_URL}/#organization`;
export const SITE_DESCRIPTION =
  'SmartFarm Electra Tech adalah platform smart farming dari Electra Tech: IoT, AI, dan Blockchain (SmartLink IoT & TraceChain) untuk pemantauan budidaya real-time, ketertelusuran rantai pasok, dan verifikasi keaslian produk.';
export const DEFAULT_OG_IMAGE = '/hero.webp';

export type PublicBlogPost = {
  id: string;
  title: string;
  thumbnail?: string;
  slug: string;
  category?: string;
  content?: string;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
};

/** Fetch blog data on the server for metadata/sitemap. Never throws. */
export async function fetchPublicBlogs<T = PublicBlogPost[]>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok && json.data ? (json.data as T) : null;
  } catch {
    return null;
  }
}

/**
 * Ambil satu artikel blog. Membedakan "tidak ada" (API 404) dari "API error",
 * supaya artikel yang benar-benar tidak ada menghasilkan HTTP 404, sedangkan
 * gangguan API tidak membuat artikel valid ikut ter-404.
 */
export async function fetchBlogBySlug(slug: string): Promise<PublicBlogPost | 'not-found' | null> {
  try {
    const res = await fetch(`${API_URL}/api/blogs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return 'not-found';
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok && json.data ? (json.data as PublicBlogPost) : null;
  } catch {
    return null;
  }
}

/** Strip HTML/Markdown into a plain-text snippet for meta descriptions. */
export function toExcerpt(content: string | undefined, max = 160): string {
  if (!content) return '';
  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`\[\]()!~-]+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function absoluteUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return src.startsWith('/uploads') ? `${API_URL}${src}` : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}
