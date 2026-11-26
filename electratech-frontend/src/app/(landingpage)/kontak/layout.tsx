import type { Metadata } from 'next';

const title = 'Kontak & Konsultasi';
const description =
  'Hubungi Electra Tech Indonesia untuk konsultasi solusi Blockchain, AI, dan IoT bagi rantai pasok dan pertanian Anda.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/kontak' },
  openGraph: { title, description, url: '/kontak' },
  twitter: { title, description },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
