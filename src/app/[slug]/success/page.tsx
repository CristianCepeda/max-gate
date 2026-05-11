import { notFound } from "next/navigation";
import Image from "next/image";
import { getBusinessBySlug } from "@/lib/supabase/server";
import { safeColor } from "@/lib/utils";

interface SuccessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const accent = safeColor(business.primary_color, "#8C9BBA");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-zinc-950">
      <div className="w-full max-w-sm">
        <div
          className="bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <div className="px-6 pt-8 pb-8 text-center">
            {/* Success icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${accent}25` }}
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
                  style={{ width: "auto" }}
                  className="object-contain max-h-12"
                />
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-2">
              You&apos;re connected!
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Enjoy free WiFi at{" "}
              <span className="font-semibold text-zinc-200">
                {business.name}
              </span>
            </p>

            {/* WiFi signal icon with checkmark */}
            <div className="flex justify-center mb-6">
              <svg
                width="43"
                height="36"
                viewBox="0 0 43 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.5 33.5002H21.5236"
                  stroke={accent}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 27.5002C18 23.5002 25 23.5002 29 27.5002"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M34.5 21.5002C26.9648 14.8335 16.5 14.8335 8.5 21.5002"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.5 15.5002C7.81579 10.1669 14.6579 7.50021 21.5 7.50018"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M27.5 8.49835C27.5 8.49835 29.5 8.49835 31.5 12.4983C31.5 12.4983 36.4532 4.70167 41.5 1.50018"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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

        <p className="mt-6 text-center text-xs text-zinc-600">
          Powered by{" "}
          <a
            href="https://maxmarketingfirm.com/"
            className="font-medium text-zinc-500 hover:text-zinc-300"
          >
            Max Marketing Firm
          </a>
        </p>
      </div>
    </div>
  );
}
