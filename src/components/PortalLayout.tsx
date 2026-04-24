import Image from 'next/image';
import { safeColor } from '@/lib/utils';

interface PortalLayoutProps {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  children: React.ReactNode;
}

export default function PortalLayout({
  businessName,
  logoUrl,
  primaryColor,
  children,
}: PortalLayoutProps) {
  const accent = safeColor(primaryColor, '#8C9BBA');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center">
            {logoUrl ? (
              <div className="flex justify-center mb-4">
                <Image
                  src={logoUrl}
                  alt={`${businessName} logo`}
                  width={120}
                  height={60}
                  className="object-contain max-h-16"
                  priority
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold"
                style={{ backgroundColor: accent }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">{children}</div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by{' '}
          <span className="font-medium text-gray-500">Max Marketing Firm</span>
        </p>
      </div>
    </div>
  );
}
