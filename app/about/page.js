'use client';

import Link from 'next/link';
import { Shield, Target, Award, Users, CheckCircle, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-14 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">Post RFQ</Link>
              <Link href="/about" className="font-medium" style={{ color: '#ca8637' }}>About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="text-gray-700 hover:text-gray-900 font-medium">Login</button>
              </Link>
              <Link href="/vendor-registration">
                <button className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90" style={{ backgroundColor: '#ca8637' }}>
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About Zintra</h1>
          <p className="text-2xl text-gray-200 mb-8">Build. Source. Connect.</p>
          <p className="text-xl text-gray-300 leading-relaxed">
            A cutting-edge digital marketplace designed to transform how construction professionals, 
            suppliers, and service providers connect, collaborate, and grow.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mission Statement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#535554' }}>Who We Are</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Zintra is a cutting-edge digital marketplace designed to transform how construction professionals, 
              suppliers, and service providers connect, collaborate, and grow. Our platform empowers businesses 
              and clients across the construction ecosystem by simplifying the process of sourcing, pricing, 
              and delivering construction solutions.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We bring together vetted vendors, professional certifications, and powerful RFQ tools to create 
              a seamless experience for everyone—from individual builders and homeowners to large contractors 
              and real estate developers.
            </p>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#535554' }}>
              What Makes Us Different
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#ca863720' }}>
                  <Shield className="w-6 h-6" style={{ color: '#ca8637' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#535554' }}>Verified Vendors</h3>
                <p className="text-gray-700">
                  We highlight vendors who submit professional documentation such as Engineering Board of Kenya 
                  or NCA certificates—creating trust and transparency.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#ca863720' }}>
                  <Target className="w-6 h-6" style={{ color: '#ca8637' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#535554' }}>Smart RFQ System</h3>
                <p className="text-gray-700">
                  Our platform lets clients post detailed RFQs and receive competitive quotations from qualified 
                  vendors across Kenya and beyond.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#ca863720' }}>
                  <Award className="w-6 h-6" style={{ color: '#ca8637' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#535554' }}>Award & Trust Signals</h3>
                <p className="text-gray-700">
                  Vendors can showcase public-facing awards and recognitions, while keeping sensitive documents 
                  private but verifiable.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#ca863720' }}>
                  <Sparkles className="w-6 h-6" style={{ color: '#ca8637' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#535554' }}>Ease of Use</h3>
                <p className="text-gray-700">
                  Whether you're managing a multi-million project or seeking supplies for a home renovation, 
                  Zintra provides a reliable, organized, and user-friendly marketplace.
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4 text-center">Our Vision</h2>
            <p className="text-xl text-center leading-relaxed">
              To be the <strong>leading construction commerce platform</strong> in Africa—championing 
              professionalism, access, and innovation in the building and infrastructure sectors.
            </p>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#535554' }}>Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: '#ca8637' }} />
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#535554' }}>Integrity</h3>
                  <p className="text-gray-700">We prioritize verified credentials and clear transactions.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: '#ca8637' }} />
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#535554' }}>Accessibility</h3>
                  <p className="text-gray-700">Zintra bridges small and large players, rural and urban markets.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: '#ca8637' }} />
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#535554' }}>Innovation</h3>
                  <p className="text-gray-700">
                    We are driven by digital-first tools that simplify complex procurement and supply workflows.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 mr-4 mt-1 flex-shrink-0" style={{ color: '#ca8637' }} />
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#535554' }}>Collaboration</h3>
                  <p className="text-gray-700">
                    We foster networks where vendors and clients build long-term, trusted relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#535554' }}>Ready to Get Started?</h2>
            <p className="text-gray-600 mb-8">Join thousands of construction professionals already using Zintra</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vendor-registration">
                <button className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#ca8637' }}>
                  Become a Vendor
                </button>
              </Link>
              <Link href="/browse">
                <button className="border-2 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50" style={{ borderColor: '#ca8637', color: '#ca8637' }}>
                  Browse Vendors
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-16 w-auto mb-4" />
              <p className="text-gray-300 mb-4">
                Connecting construction professionals with quality materials and services across Kenya.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/post-rfq" className="hover:text-white">Post RFQ</Link></li>
                <li><Link href="/browse" className="hover:text-white">Find Vendors</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/about" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zintra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}