'use client';

import Image from 'next/image';
import { FaApple, FaGooglePlay, FaMobileAlt, FaBolt, FaShieldAlt, FaChartLine } from 'react-icons/fa';

export default function Download() {
  const features = [
    {
      icon: FaMobileAlt,
      title: 'Mobile First',
      description: 'Optimized for iOS and Android devices',
    },
    {
      icon: FaBolt,
      title: 'Real-time Updates',
      description: 'Instant notifications for pairings and results',
    },
    {
      icon: FaShieldAlt,
      title: 'Secure & Reliable',
      description: 'Your data is protected and always available',
    },
    {
      icon: FaChartLine,
      title: 'Track Progress',
      description: 'Monitor your rankings and tournament history',
    },
  ];

  const requirements = {
    ios: {
      version: 'iOS 13.0 or later',
      devices: 'iPhone, iPad, iPod touch',
      size: '~50 MB',
    },
    android: {
      version: 'Android 6.0 or later',
      devices: 'Most Android devices',
      size: '~50 MB',
    },
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8 flex justify-center">
            <Image
              src="/genki-head.png"
              alt="Genki TCG"
              width={120}
              height={120}
              className="drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-genki-red via-genki-red-light to-genki-red bg-clip-text text-transparent">
            Download Genki TCG
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Join the competitive TCG community. Track rankings, participate in tournaments, and connect with players worldwide.
          </p>
        </div>

        {/* App Store Badges */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-text-primary">
              Get the App
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* iOS App Store Button */}
              <a
                href="#"
                className="group relative w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  alert('iOS app is currently in TestFlight beta. Check back soon for the App Store release!');
                }}
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-gray-900 border border-white/20 rounded-xl transition-all transform hover:scale-105">
                  <FaApple className="w-10 h-10 text-white" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-xl font-semibold text-white">App Store</div>
                  </div>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="#"
                className="group relative w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Android app is coming soon! Check back for updates.');
                }}
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-gray-900 border border-white/20 rounded-xl transition-all transform hover:scale-105">
                  <FaGooglePlay className="w-9 h-9 text-white" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400">GET IT ON</div>
                    <div className="text-xl font-semibold text-white">Google Play</div>
                  </div>
                </div>
              </a>
            </div>
            <p className="text-center text-text-tertiary text-sm mt-6">
              Currently in beta • Early access available
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-text-primary">
            What You'll Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass p-6 rounded-xl text-center hover:bg-background-elevated transition-all"
                >
                  <div className="w-12 h-12 bg-genki-red/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-genki-red" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Requirements */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-text-primary">
            System Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* iOS Requirements */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-genki-red/20 rounded-lg flex items-center justify-center">
                  <FaApple className="w-7 h-7 text-genki-red" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">iOS</h3>
              </div>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Version:</strong> {requirements.ios.version}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Devices:</strong> {requirements.ios.devices}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Size:</strong> {requirements.ios.size}</span>
                </li>
              </ul>
            </div>

            {/* Android Requirements */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-genki-red/20 rounded-lg flex items-center justify-center">
                  <FaGooglePlay className="w-6 h-6 text-genki-red" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Android</h3>
              </div>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Version:</strong> {requirements.android.version}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Devices:</strong> {requirements.android.devices}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-genki-red mr-2">•</span>
                  <span><strong>Size:</strong> {requirements.android.size}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-text-primary text-center">
              Getting Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-genki-red rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="font-bold mb-2 text-text-primary">Download</h3>
                <p className="text-text-secondary text-sm">
                  Get the app from the App Store or Google Play
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-genki-red rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="font-bold mb-2 text-text-primary">Create Account</h3>
                <p className="text-text-secondary text-sm">
                  Sign up with email or link your Discord account
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-genki-red rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="font-bold mb-2 text-text-primary">Start Playing</h3>
                <p className="text-text-secondary text-sm">
                  Join tournaments and climb the rankings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-text-secondary mb-4">
            Need help getting started?
          </p>
          <a
            href="/support"
            className="inline-block px-8 py-3 glass hover:bg-background-elevated text-text-primary rounded-lg font-semibold transition-all"
          >
            Visit Support Center
          </a>
        </div>
      </div>
    </div>
  );
}
