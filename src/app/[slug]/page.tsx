import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/supabase';
import { verifyFASKeyHash } from '@/lib/opennds';
import PortalLayout from '@/components/PortalLayout';
import CaptureForm from '@/components/CaptureForm';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fas?: string; sha256?: string }>;
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const { slug } = await params;
  const { fas = '', sha256 = '' } = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  if (!sha256 || !verifyFASKeyHash(business.faskey, sha256)) {
    return (
      <PortalLayout
        businessName={business.name}
        logoUrl={business.logo_url}
        primaryColor={business.primary_color}
      >
        <p className="text-center text-sm text-red-600">
          This page must be accessed through the WiFi portal. Please reconnect to the network.
        </p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      businessName={business.name}
      logoUrl={business.logo_url}
      primaryColor={business.primary_color}
    >
      <CaptureForm
        slug={slug}
        fas={fas}
        sha256={sha256}
        welcomeMessage={business.welcome_message}
        termsText={business.terms_text}
        primaryColor={business.primary_color}
      />
    </PortalLayout>
  );
}
