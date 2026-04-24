'use client';

import { useState } from 'react';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  termsText: string;
  primaryColor: string;
}

export default function TermsCheckbox({
  checked,
  onChange,
  termsText,
  primaryColor,
}: TermsCheckboxProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 flex-shrink-0 cursor-pointer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ accentColor: primaryColor }}
          aria-label="I agree to the Terms of Service"
        />
        <span className="text-sm text-gray-600 leading-snug">
          I agree to the{' '}
          <button
            type="button"
            className="underline font-medium focus:outline-none"
            style={{ color: primaryColor }}
            onClick={() => setModalOpen(true)}
          >
            Terms of Service
          </button>
        </span>
      </label>

      {/* Terms Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Terms of Service</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {termsText}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  onChange(true);
                  setModalOpen(false);
                }}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
