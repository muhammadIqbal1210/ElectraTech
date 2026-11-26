import type { Metadata } from 'next';

const title = 'Blog & Berita';
const description =
  'Berita, artikel, dan wawasan terbaru dari Electra Tech Indonesia seputar blockchain, IoT, smart farming, dan ketertelusuran rantai pasok.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/blog' },
  openGraph: { title, description, url: '/blog' },
  twitter: { title, description },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
