import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
