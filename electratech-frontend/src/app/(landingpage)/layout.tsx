import PublicAiAgent from '@/components/PublicAiAgent';

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <PublicAiAgent />
    </>
  );
}

