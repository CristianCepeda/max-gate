'use client';

import { useState, useCallback } from 'react';
import TermsCheckbox from '@/components/TermsCheckbox';
import { safeColor } from '@/lib/utils';

const DEFAULT_TERMS =
  'By connecting to this free WiFi network, you agree to receive occasional marketing communications from this business. You can unsubscribe at any time. Your information will not be sold to third parties.';

interface CaptureFormProps {
  slug: string;
  fas: string;
  businessName: string;
  welcomeMessage: string;
  termsText: string | null;
  primaryColor: string;
}

type FormState = 'idle' | 'loading' | 'error';

export default function CaptureForm({
  slug,
  fas,
  businessName,
  welcomeMessage,
  termsText,
  primaryColor,
}: CaptureFormProps) {
  const accent = safeColor(primaryColor, '#8C9BBA');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formState === 'loading') return;

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please fill in all fields.');
      setFormState('error');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      setFormState('error');
      return;
    }

    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone, slug, fas }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      // Redirect to the openNDS auth endpoint — grants WiFi access
      window.location.href = data.redirectUrl;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setFormState('error');
    }
  }

  const isLoading = formState === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Welcome message */}
      <p className="text-center text-gray-500 text-sm mb-6">{welcomeMessage}</p>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
            disabled={isLoading}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(555) 555-5555"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
            disabled={isLoading}
          />
        </div>

        {/* Terms */}
        <TermsCheckbox
          checked={agreed}
          onChange={setAgreed}
          termsText={termsText ?? DEFAULT_TERMS}
          primaryColor={accent}
        />

        {/* Error message */}
        {formState === 'error' && errorMsg && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-70 cursor-pointer"
          style={{ backgroundColor: accent }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect to Free WiFi'
          )}
        </button>

        {/* Trust signal */}
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Your information is secure
        </p>
      </div>
    </form>
  );
}
