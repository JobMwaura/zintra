/**
 * FAQ Component - Frequently Asked Questions
 * Collapsible FAQ section for workers and employers
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = {
  workers: [
    {
      id: 1,
      question: 'How do I create a profile on Zintra?',
      answer: 'Click "Create Your Profile" on the careers page, fill in your details (name, role, location, skills), upload a profile photo, and you\'re ready to start applying for jobs. It takes about 5 minutes.'
    },
    {
      id: 2,
      question: 'Is it really free for workers?',
      answer: 'Yes! Zintra is completely free for workers. No registration fees, no upfront costs, and no hidden charges. We only take a small platform fee after you complete work and get paid.'
    },
    {
      id: 3,
      question: 'How do I get paid?',
      answer: 'After you complete a job or gig, the employer releases payment through Zintra. You receive payment via your preferred method (M-Pesa, bank transfer, or wallet) within 24-48 hours.'
    },
    {
      id: 4,
      question: 'What if there\'s a problem with payment?',
      answer: 'Zintra holds payments securely until the job is completed. If there\'s a dispute, our support team steps in to resolve it fairly. All workers are protected by our payment guarantee.'
    },
    {
      id: 5,
      question: 'Can I report an employer if they\'re not legitimate?',
      answer: 'Absolutely. We have a strict verification process for all employers, but if you encounter any issues, you can report them immediately. We investigate all reports and remove bad actors from the platform.'
    },
    {
      id: 6,
      question: 'How often can I apply for jobs?',
      answer: 'You can apply for as many jobs and gigs as you want, whenever you want. Work as much or as little as you prefer. It\'s completely flexible.'
    }
  ],
  employers: [
    {
      id: 1,
      question: 'How much does it cost to post a job?',
      answer: 'Posting jobs and gigs on Zintra is free. You only pay a small platform fee when you hire someone (deducted from the agreed project cost).'
    },
    {
      id: 2,
      question: 'How long does it take to find the right worker?',
      answer: 'Most employers find qualified workers within 24-48 hours. Our verification process ensures you\'re only seeing experienced, trustworthy workers rated by previous employers.'
    },
    {
      id: 3,
      question: 'Are workers really verified?',
      answer: 'Yes. All workers go through our verification process which includes background checks, skill assessments, and ratings from previous employers. You can see their full profile and work history.'
    },
    {
      id: 4,
      question: 'What if a worker doesn\'t show up?',
      answer: 'We have a reliability rating system. Workers with no-shows get penalized. If you have issues, our support team steps in to resolve them and find you a replacement if needed.'
    },
    {
      id: 5,
      question: 'How do I ensure my project is completed on time?',
      answer: 'Clear job descriptions, agreed timelines, and progress tracking help. We recommend being specific about requirements. You can also communicate directly with workers through the platform.'
    },
    {
      id: 6,
      question: 'Can I rehire the same worker?',
      answer: 'Absolutely! Many employers become repeat customers of their favorite workers. Once you find someone great, you can directly message them for future projects.'
    }
  ]
};

const FAQAccordion = ({ items, title }) => {
  const [openId, setOpenId] = useState(null);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="mb-12">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
        {title}
      </h3>

      <div className="space-y-3">
        {items.map((faq) => (
          <div
            key={faq.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Question Button */}
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="font-semibold text-gray-900 text-sm sm:text-base">
                {faq.question}
              </span>
              <ChevronDown
                size={20}
                className={`text-[#ea8f1e] flex-shrink-0 transition-transform ${
                  openId === faq.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Answer - Collapsible */}
            {openId === faq.id && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function FAQ() {
  const [activeTab, setActiveTab] = useState('workers');

  return (
    <section className="w-full bg-gray-50 border-b border-gray-200 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Find answers to common questions about using Zintra
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-10 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors border-b-2 ${
              activeTab === 'workers'
                ? 'text-[#ea8f1e] border-[#ea8f1e]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            For Workers
          </button>
          <button
            onClick={() => setActiveTab('employers')}
            className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors border-b-2 ${
              activeTab === 'employers'
                ? 'text-[#ea8f1e] border-[#ea8f1e]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            For Employers
          </button>
        </div>

        {/* FAQ Content */}
        <div className="bg-white rounded-lg p-6 sm:p-8">
          {activeTab === 'workers' && (
            <FAQAccordion items={faqs.workers} title="Worker Questions" />
          )}
          {activeTab === 'employers' && (
            <FAQAccordion items={faqs.employers} title="Employer Questions" />
          )}
        </div>

        {/* Still need help? */}
        <div className="mt-10 text-center">
          <p className="text-gray-700 mb-4">
            Can't find the answer you're looking for?
          </p>
          <button className="px-6 py-2.5 border-2 border-[#ea8f1e] text-[#ea8f1e] font-bold rounded-lg hover:bg-orange-50 transition-colors text-sm">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
