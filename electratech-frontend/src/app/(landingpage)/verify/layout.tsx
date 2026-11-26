import type { Metadata } from 'next';

const title = 'Verifikasi Keaslian Produk';
const description =
  'Pindai QR code atau masukkan ID produk untuk memverifikasi keaslian dan riwayat rantai pasok produk melalui TraceChain Electra Tech.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/verify' },
  openGraph: { title, description, url: '/verify' },
  twitter: { title, description },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
