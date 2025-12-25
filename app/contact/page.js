'use client';

import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-orange-600">
            Zintra
          </a>
          <div className="flex gap-8">
            <a href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Home</a>
            <a href="/browse" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Browse</a>
            <a href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Post RFQ</a>
            <a href="/about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">About</a>
            <a href="/contact" className="text-orange-600 font-medium transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Zintra</h1>
          <p className="text-orange-100 text-lg">Get in touch with us for any inquiries</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Address Card */}
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-gray-700 leading-relaxed">
                  Jakaya Kikwete Road<br />
                  Milimani Business Park<br />
                  Nairobi<br />
                  <span className="font-medium mt-2 block">P. O. Box 781 - 00100 GPO</span>
                  Nairobi, Kenya
                </p>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
                <a 
                  href="tel:+254717871237"
                  className="text-orange-600 hover:text-orange-700 font-semibold text-lg"
                >
                  +254 717 871 237
                </a>
                <p className="text-gray-600 text-sm mt-2">Call us during business hours</p>
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <a 
                  href="mailto:info@zintra.co.ke"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  info@zintra.co.ke
                </a>
                <p className="text-gray-600 text-sm mt-2">We'll respond within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
          <iframe
            width="100%"
            height="450"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen=""
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8217652253046!2d36.79849!3d-1.2920659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d6d2e8c8ff%3A0x3d8c3c8c8c8c8c8c!2sJakaya%20Kikwete%20Road%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1640000000000"
          ></iframe>
        </div>

        {/* Business Hours */}
        <div className="bg-orange-50 rounded-lg p-8 border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Monday - Friday</h3>
              <p className="text-gray-700">8:00 AM - 5:30 PM</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Saturday - Sunday</h3>
              <p className="text-gray-700">Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-orange-500 transition-colors">Home</a></li>
                <li><a href="/browse" className="hover:text-orange-500 transition-colors">Browse Vendors</a></li>
                <li><a href="/post-rfq" className="hover:text-orange-500 transition-colors">Post RFQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-orange-500 transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="mailto:info@zintra.co.ke" className="hover:text-orange-500 transition-colors">Email Support</a></li>
                <li><a href="tel:+254717871237" className="hover:text-orange-500 transition-colors">Call Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-gray-400">
              &copy; 2024 Zintra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}