'use client';

import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Mail, MessageCircle, HelpCircle, Search, ChevronDown } from 'lucide-react';

const SupportPage = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'What is SheMax?',
      answer: 'SheMax is an AI-powered beauty analysis app that provides facial analysis, transformation simulations, AI coaching, and beauty tracking. It\'s designed for self-improvement and confidence building through data-driven insights.',
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI uses advanced computer vision technology to analyze facial features and provide a comprehensive beauty score. The analysis considers facial symmetry, skin quality, features, and other factors. Results are for informational and entertainment purposes.',
    },
    {
      question: 'What are the subscription tiers?',
      answer: 'We offer Elite subscription plans with features like AI transformations, AI coach, looksmaxxing routines, and community features. Each tier provides different levels of access to premium features.',
    },
    {
      question: 'How do AI transformations work?',
      answer: 'AI transformations show you how you could look in different scenarios (formal events, fitness model, beach, etc.). The technology uses your face to generate photorealistic images while maintaining your identity. You can generate up to 5 per day.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! You can cancel your subscription at any time through the app settings or your account dashboard. There are no long-term contracts or cancellation fees.',
    },
    {
      question: 'Is my data private and secure?',
      answer: 'Your privacy is important to us. All images are encrypted and stored securely. We use industry-standard security practices. Photos are never shared publicly without your consent. See our Privacy Policy for more details.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'You can request account deletion through Settings > Account > Delete Account. This will remove all your data permanently. Alternatively, email us and we\'ll process it for you.',
    },
    {
      question: 'What devices does the app support?',
      answer: 'SheMax is available on iOS and Android through the app stores. A web version is also available for some features.',
    },
    {
      question: 'Why is my transformation taking a long time?',
      answer: 'AI transformations can take 30-60 seconds depending on server load. This is normal. If it takes longer than 5 minutes, try refreshing or generating again.',
    },
    {
      question: 'How accurate is the beauty score?',
      answer: 'The score is based on AI analysis of facial features. It\'s meant to be informational and for entertainment. Beauty is subjective and personal worth is not determined by any score.',
    },
    {
      question: 'Can I use photos of other people?',
      answer: 'SheMax should only be used with photos of yourself. Using photos of others without consent violates our terms of service and may result in account suspension.',
    },
    {
      question: 'Do you have a referral program?',
      answer: 'Yes! Refer friends to SheMax and earn rewards. You can share your unique referral code through the app or website.',
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Find answers to common questions, get in touch with our team, or explore helpful resources.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Email Support */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-yellow-500/50 transition">
              <Mail className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-gray-400 mb-4">
                Get in touch with our support team for detailed assistance.
              </p>
              <a
                href="mailto:support@shemax.app"
                className="text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-2"
              >
                support@shemax.app
              </a>
            </div>

            {/* Live Chat */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-yellow-500/50 transition">
              <MessageCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">In-App Support</h3>
              <p className="text-gray-400 mb-4">
                Message our support team directly from the app for quick answers.
              </p>
              <button className="text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-2">
                Open Support Chat
              </button>
            </div>

            {/* Resources */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-yellow-500/50 transition">
              <HelpCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Resources</h3>
              <p className="text-gray-400 mb-4">
                Browse our guides and documentation for self-help.
              </p>
              <div className="space-y-2">
                <a href="/privacy" className="text-yellow-500 hover:text-yellow-400 font-medium block">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-yellow-500 hover:text-yellow-400 font-medium block">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition"
                  >
                    <span className="text-left font-semibold text-white">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-yellow-500 transform transition ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 text-gray-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No FAQs found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-12 px-4 bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Important Notice</h3>
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-sm text-gray-300">
            <p className="mb-3">
              <strong>Medical Disclaimer:</strong> SheMax provides AI-powered beauty analysis for
              informational and entertainment purposes only.
            </p>
            <p className="mb-3">
              This app is NOT a substitute for professional medical, psychological, or cosmetic advice. Results
              are based on AI analysis and should not be considered definitive assessments of beauty or
              self-worth.
            </p>
            <p>
              Your worth as a person is not determined by any score or analysis. If you experience negative
              emotional impacts from using this app, please seek professional support.
            </p>
          </div>
        </div>
      </section>

      {/* Still Need Help? */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Still Need Help?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Our support team is here to help. Reach out to us and we'll get back to you as soon as possible.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="mailto:support@shemax.app"
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition"
            >
              Contact Support
            </a>
            <a
              href="/"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SupportPage;

