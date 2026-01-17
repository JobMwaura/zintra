/**
 * SafetyNote Component
 * Footer section with safety information and reporting links
 */

"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function SafetyNote() {
  return (
    <section className="w-full bg-blue-50 py-12 sm:py-16 border-t border-blue-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 sm:gap-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-blue-600 mt-1" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              Your Safety is Our Priority
            </h3>
            <p className="text-blue-800 mb-4">
              All employers and workers are verified. We monitor listings to
              prevent scams and fraud. If you encounter suspicious activity,
              please report it immediately. Never share your personal banking
              information with anyone on the platform—payments are always
              processed securely through Zintra.
            </p>

            {/* Action Links */}
            <div className="flex flex-wrap gap-4">
              <button
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // TODO: Open report form or modal
                  console.log("Report job clicked");
                }}
              >
                <span>🚨</span> Report a Job
              </button>
              <Link
                href="/careers/safety"
                className="inline-flex items-center gap-2 px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                <span>💡</span> Career Advice & Tips
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
