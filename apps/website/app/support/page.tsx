'use client';

import { useState } from 'react';
import { FaQuestionCircle, FaEnvelope, FaDiscord, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Download the Genki TCG app from the App Store or Google Play. You can sign up using your email address or link your Discord account for quick registration.',
    },
    {
      question: 'How do I join a tournament?',
      answer: 'Browse available tournaments in the app, select the tournament you want to join, and click "Register". Make sure to check in before the tournament starts to confirm your participation.',
    },
    {
      question: 'How are rankings calculated?',
      answer: 'Rankings are based on a competitive rating system that takes into account your tournament performance, match results, and opponent strength. Your rank is updated after each tournament.',
    },
    {
      question: 'Can I organize my own tournament?',
      answer: 'Yes! Tournament organizers can use the Admin Portal to create and manage tournaments. Contact us at organizers@genkitcg.app to get organizer access.',
    },
    {
      question: 'What happens if I disconnect during a tournament?',
      answer: 'If you experience connectivity issues, try to reconnect as soon as possible. Tournament organizers can adjust pairings or extend round times if needed. Contact the organizer immediately if you have technical difficulties.',
    },
    {
      question: 'How do I report match results?',
      answer: 'After each match, both players can submit the result through the app. Once both players confirm, the result is recorded. If there\'s a dispute, contact the tournament organizer.',
    },
    {
      question: 'Can I change my username or profile picture?',
      answer: 'Yes! Go to your profile settings in the app to update your username, profile picture, and other account information.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'You can delete your account from the app settings under "Account" > "Delete Account". Note that this action is permanent and will remove all your data, including tournament history.',
    },
    {
      question: 'What games are supported?',
      answer: 'Currently, Genki TCG supports One Piece TCG, Azuki TCG, and Riftbound. We\'re continuously adding support for more trading card games.',
    },
    {
      question: 'Is there a desktop version?',
      answer: 'Tournament organizers have access to a web-based Admin Portal for managing events. Players use the mobile app to participate in tournaments and track their rankings.',
    },
    {
      question: 'How do I enable push notifications?',
      answer: 'Go to your device settings, find Genki TCG, and enable notifications. You can also customize notification preferences in the app settings.',
    },
    {
      question: 'What should I do if I find a bug?',
      answer: 'Please report bugs to support@genkitcg.app with details about the issue, your device model, and steps to reproduce the problem. Screenshots are helpful!',
    },
  ];

  const contactMethods = [
    {
      icon: FaEnvelope,
      title: 'Email Support',
      description: 'Get help from our support team',
      contact: 'support@genkitcg.app',
      action: 'mailto:support@genkitcg.app',
    },
    {
      icon: FaDiscord,
      title: 'Discord Community',
      description: 'Join our community server',
      contact: 'Join Server',
      action: 'https://discord.gg/6bAh6ArXhw',
    },
    {
      icon: FaQuestionCircle,
      title: 'Bug Reports',
      description: 'Report technical issues',
      contact: 'bugs@genkitcg.app',
      action: 'mailto:bugs@genkitcg.app',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            How Can We Help?
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <a
                key={method.title}
                href={method.action}
                className="glass p-6 rounded-xl hover:bg-background-elevated transition-all transform hover:scale-105 text-center"
              >
                <div className="w-16 h-16 bg-genki-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-genki-red" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">
                  {method.title}
                </h3>
                <p className="text-text-secondary mb-3">
                  {method.description}
                </p>
                <p className="text-genki-red font-semibold">
                  {method.contact}
                </p>
              </a>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-text-primary text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-background-elevated transition-colors"
                >
                  <span className="text-left font-semibold text-text-primary">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <FaChevronUp className="w-5 h-5 text-genki-red flex-shrink-0 ml-4" />
                  ) : (
                    <FaChevronDown className="w-5 h-5 text-text-tertiary flex-shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="glass p-8 rounded-xl text-center">
            <h3 className="text-2xl font-bold mb-4 text-text-primary">
              Still Need Help?
            </h3>
            <p className="text-text-secondary mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@genkitcg.app"
                className="px-8 py-3 bg-genki-red hover:bg-genki-red-dark text-white rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Contact Support
              </a>
              <a
                href="/download"
                className="px-8 py-3 glass hover:bg-background-elevated text-text-primary rounded-lg font-semibold transition-all"
              >
                Download App
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-3 text-text-primary">For Players</h4>
            <ul className="space-y-2 text-text-secondary">
              <li>• Getting started guide</li>
              <li>• Tournament participation tips</li>
              <li>• Understanding rankings</li>
              <li>• Profile customization</li>
            </ul>
          </div>
          <div className="glass p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-3 text-text-primary">For Organizers</h4>
            <ul className="space-y-2 text-text-secondary">
              <li>• Creating tournaments</li>
              <li>• Managing participants</li>
              <li>• Swiss pairings system</li>
              <li>• Admin portal access</li>
            </ul>
            <a
              href="mailto:organizers@genkitcg.app"
              className="inline-block mt-4 text-genki-red hover:text-genki-red-light font-semibold transition-colors"
            >
              Request Organizer Access →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
