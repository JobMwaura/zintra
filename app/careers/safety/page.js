'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Shield, CheckCircle, AlertCircle, Lock, Eye, FileText } from 'lucide-react';
import CareersNavbar from '@/components/careers/CareersNavbar';

export default function SafetyPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  const safetyTopics = [
    {
      id: 1,
      title: 'How Zintra Career Centre Protects You',
      icon: Shield,
      content: [
        'All employer profiles are verified and identity-checked before they can post jobs',
        'Only legitimate, registered businesses can access our talent network',
        'We maintain strict data security with encrypted communications',
        'Direct messages are monitored for suspicious activity',
      ],
    },
    {
      id: 2,
      title: 'Safe Communication Practices',
      icon: Eye,
      content: [
        'Never share your banking details, account numbers, or payment information',
        'Be cautious of job offers that promise unrealistic pay or require upfront payments',
        'Always communicate through the Zintra platform - avoid switching to personal messaging apps early',
        'If an employer asks you to download third-party applications or install software, verify with us first',
      ],
    },
    {
      id: 3,
      title: 'Payment Safety',
      icon: Lock,
      content: [
        'Legitimate employers will pay through verified payment methods',
        'Never accept "advances" or "deposits" to confirm a job',
        'Always verify payment details before starting work',
        'For gigs and freelance work, use Zintra\'s secure payment escrow system',
        'Report any suspicious payment requests immediately',
      ],
    },
    {
      id: 4,
      title: 'Red Flags & How to Report',
      icon: AlertCircle,
      content: [
        'Job offers with unusually high pay for minimal work',
        'Requests for personal identification documents beyond what\'s needed',
        'Pressure to provide personal information or financial details quickly',
        'Job offers that come with mandatory purchases or "training fees"',
        'Employers who avoid video calls or in-person meetings',
      ],
    },
    {
      id: 5,
      title: 'Data Privacy',
      icon: FileText,
      content: [
        'Your profile information is only visible to verified employers',
        'We never share your contact details without your permission',
        'Your personal data is encrypted and stored securely',
        'You can request data deletion at any time',
        'Review our full Privacy Policy in the main site footer',
      ],
    },
  ];

  const SafetyTips = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {[
        { title: '✓ DO', items: ['Use the Zintra platform for all communication', 'Ask detailed questions about the job', 'Verify employer credentials', 'Report suspicious activity immediately'] },
        { title: '✗ DON\'T', items: ['Share banking or financial information', 'Accept jobs requiring upfront fees', 'Leave the platform for communication', 'Provide passwords or sensitive data'] },
      ].map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg p-6 border-2 border-orange-200">
          <h3 className={`text-lg font-bold mb-4 ${section.title.includes('DO') ? 'text-green-600' : 'text-red-600'}`}>
            {section.title}
          </h3>
          <ul className="space-y-3">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                {section.title.includes('DO') ? (
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                ) : (
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                )}
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CareersNavbar />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back to Career Centre
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield size={40} />
            <h1 className="text-4xl font-bold">Safety & Security</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-2xl">
            Your safety is our top priority. Learn how to protect yourself and recognize suspicious activity.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Tips */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Safety Quick Tips</h2>
          <SafetyTips />
        </section>

        {/* Detailed Sections */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Safety Guide</h2>
          <div className="space-y-4">
            {safetyTopics.map((topic) => {
              const Icon = topic.icon;
              const isExpanded = expandedSection === topic.id;

              return (
                <div key={topic.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : topic.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="text-blue-600 flex-shrink-0" size={28} />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">
                        {topic.title}
                      </h3>
                    </div>
                    <span className={`text-blue-600 transition ${isExpanded ? 'transform rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <ul className="space-y-3">
                        {topic.content.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Report Suspicious Activity */}
        <section className="mt-16 bg-red-50 border-l-4 border-red-500 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-xl font-bold text-red-900 mb-2">
                Found Something Suspicious?
              </h3>
              <p className="text-red-800 mb-4">
                Report it immediately to our safety team. We take every report seriously and investigate promptly.
              </p>
              <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                Report Suspicious Listing
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is my personal information safe on Zintra Career Centre?',
                a: 'Yes. All data is encrypted and stored securely. Only verified employers can see your profile, and we never share your contact details without permission.',
              },
              {
                q: 'What happens if I encounter a suspicious job posting?',
                a: 'Use the report button immediately. Our safety team will review it within 24 hours and take appropriate action, including removing fraudulent listings.',
              },
              {
                q: 'Can I work with someone off the platform?',
                a: 'You can, but we recommend using our secure platform. We monitor communication, process payments safely, and provide recourse if issues arise.',
              },
              {
                q: 'What if I made a mistake and shared sensitive information?',
                a: 'Contact our support team immediately. Do not send any payments. We can help verify if a job posting is legitimate.',
              },
              {
                q: 'How are employers verified on Zintra?',
                a: 'All employers provide business registration details, company information, and complete identity verification. We conduct background checks on company officials.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Additional Help?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Our safety and support team is available 24/7 to help you with any concerns or questions about your security.
          </p>
          <div className="space-y-3">
            <p className="text-gray-700">
              <strong>Email:</strong> safety@zintra.com
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> +1 (800) ZINTRA-1
            </p>
            <p className="text-gray-700">
              <strong>Available:</strong> 24/7 for emergency reports
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
