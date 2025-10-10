'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle, Linkedin, Twitter, Instagram, Youtube, HelpCircle, Shield } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitted(true);
      setIsLoading(false);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
              <Link href="/contact" className="font-medium" style={{ color: '#ca8637' }}>Contact</Link>
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

      <section className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Let's Build Together</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Have questions? Need support? Our team is here to help you succeed.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <a href="tel:+254700000000" className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#ca863720' }}>
                <Phone className="w-6 h-6" style={{ color: '#ca8637' }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
              <p className="text-sm text-gray-600 text-center">+254 700 000 000</p>
            </a>
            <a href="mailto:support@zintra.com" className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#ca863720' }}>
                <Mail className="w-6 h-6" style={{ color: '#ca8637' }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-gray-600 text-center">support@zintra.com</p>
            </a>
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#ca863720' }}>
                <MessageCircle className="w-6 h-6" style={{ color: '#ca8637' }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
              <p className="text-sm text-gray-600 text-center">Chat with us</p>
            </a>
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#ca863720' }}>
                <MapPin className="w-6 h-6" style={{ color: '#ca8637' }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
              <p className="text-sm text-gray-600 text-center">Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div id="contact-form">
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#535554' }}>Send Us a Message</h2>
              <p className="text-gray-600 mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">Thank You!</h3>
                  <p className="text-green-800">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#535554' }}>Full Name*</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500" placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#535554' }}>Email Address*</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500" placeholder="your.email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#535554' }}>Subject*</label>
                    <select name="subject" value={formData.subject} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                      <option value="">Select a subject</option>
                      <option value="vendor-support">Vendor Support</option>
                      <option value="account-issues">Account Issues</option>
                      <option value="general-inquiry">General Inquiry</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#535554' }}>Message*</label>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} required rows="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500" placeholder="Tell us how we can help you..."></textarea>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ backgroundColor: '#ca8637' }}>
                    {isLoading ? 'Sending...' : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <HelpCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Need answers fast?</p>
                    <Link href="/about" className="text-sm text-blue-700 hover:underline">Visit our Help Center</Link>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#535554' }}>Our Location</h3>
                <div className="rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '300px' }}>
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127641.66360102826!2d36.70730744453125!3d-1.3028617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2s!4v1234567890" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#535554' }}>Why Choose Zintra?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="font-semibold text-gray-900">Verified Vendors</p>
                      <p className="text-sm text-gray-600">All vendors undergo thorough verification</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="font-semibold text-gray-900">Trusted by 100+ Vendors</p>
                      <p className="text-sm text-gray-600">Growing network across Kenya</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="font-semibold text-gray-900">Secure Platform</p>
                      <p className="text-sm text-gray-600">Your data is protected</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Connect With Us</h3>
                <p className="text-gray-200 text-sm mb-6">Follow us for updates and tips</p>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Linkedin className="w-6 h-6" style={{ color: '#0077b5' }} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Twitter className="w-6 h-6" style={{ color: '#1da1f2' }} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Instagram className="w-6 h-6" style={{ color: '#e4405f' }} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Youtube className="w-6 h-6" style={{ color: '#ff0000' }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#535554' }}>Frequently Asked Questions</h2>
            <p className="text-gray-600">Find quick answers to common questions</p>
          </div>
          <div className="space-y-4">
            <details className="bg-white rounded-lg border border-gray-200 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900">How do I register as a vendor on Zintra?</h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">Click on Sign Up, select Vendor Registration, and complete the form. Upload documents, select a plan, and complete payment via M-Pesa.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900">How does the RFQ system work?</h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">Submit your requirements. We match you with 5-7 qualified vendors who submit quotes. Compare and select the best vendor.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900">What are the subscription plans?</h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">Basic (KSh 2,999), Standard (KSh 5,999), Premium (KSh 9,999), and Diamond (KSh 19,999) monthly plans.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900">How are vendors verified?</h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">We review business documents, certifications, portfolio, and contact info. Verified vendors get a badge.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-6 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-gray-900">Is it free to post an RFQ?</h3>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">Yes! Creating an account and posting RFQs is completely free for buyers.</p>
            </details>
          </div>
          <div className="mt-12 text-center p-8 bg-white rounded-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#535554' }}>Still Have Questions?</h3>
            <p className="text-gray-600 mb-6">Our team is here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact-form" className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 inline-block" style={{ backgroundColor: '#ca8637' }}>Contact Support</a>
              <Link href="/about" className="px-6 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 inline-block" style={{ borderColor: '#ca8637', color: '#ca8637' }}>Visit Help Center</Link>
            </div>
          </div>
        </div>
      </section>

      <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50" style={{ backgroundColor: '#25D366' }}>
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      <footer className="bg-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src="/zintrass-new-logo.png" alt="Zintra" className="h-20 w-auto" />
              </div>
              <p className="text-gray-200 text-lg font-medium leading-tight">The smarter way to source, hire, and build.</p>
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
          <div className="border-t border-slate-600 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zintra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}