import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/supabase';
import PortalLayout from '@/components/PortalLayout';
import CaptureForm from '@/components/CaptureForm';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fas?: string }>;
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const { slug } = await params;
  const { fas = '' } = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <PortalLayout
      businessName={business.name}
      logoUrl={business.logo_url}
      primaryColor={business.primary_color}
    >
      <CaptureForm
        slug={slug}
        fas={fas}
        businessName={business.name}
        welcomeMessage={business.welcome_message}
        termsText={business.terms_text}
        primaryColor={business.primary_color}
      />
    </PortalLayout>
  );
}
