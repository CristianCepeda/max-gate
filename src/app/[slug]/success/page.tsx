import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getBusinessBySlug } from '@/lib/supabase';
import { safeColor } from '@/lib/utils';

interface SuccessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const accent = safeColor(business.primary_color, '#8C9BBA');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-sm">
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <div className="px-6 pt-8 pb-8 text-center">
            {/* Success icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${accent}20` }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke={accent}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Business logo */}
            {business.logo_url && (
              <div className="flex justify-center mb-4">
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={100}
                  height={50}
                  className="object-contain max-h-12"
                />
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re connected!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enjoy free WiFi at{' '}
              <span className="font-semibold text-gray-700">{business.name}</span>
            </p>

            {/* WiFi signal icon */}
            <div className="flex justify-center mb-6">
              <svg
                className="w-10 h-10"
                fill={accent}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M1.5 8.5a13 13 0 0121 0M5 12a9 9 0 0114 0M8.5 15.5a5 5 0 017 0M12 19h.01" />
              </svg>
            </div>

            {/* CTA link to business site */}
            {business.redirect_url && (
              <a
                href={business.redirect_url}
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                Visit {business.name}
              </a>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by{' '}
          <span className="font-medium text-gray-500">Max Marketing Firm</span>
        </p>
      </div>
    </div>
  );
}
