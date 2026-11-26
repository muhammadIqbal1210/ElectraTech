import type { Metadata } from 'next';
import PublicAiAgent from '@/components/PublicAiAgent';
import { ORG_ID, ORG_NAME, ORG_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // Organisasi induk = web utama electratech.id (bukan subdomain ini)
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: ORG_NAME,
      url: ORG_URL,
      logo: `${SITE_URL}/logoelectra.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: ['SmartFarm Electra', 'Electra Tech SmartFarm'],
      description: SITE_DESCRIPTION,
      inLanguage: 'id-ID',
      publisher: { '@id': ORG_ID },
    },
  ],
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {children}
      <PublicAiAgent />
    </>
  );
}
