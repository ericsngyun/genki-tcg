import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Genki TCG',
  description: 'Terms of Service for Genki TCG tournament management platform',
};

export default function TermsOfService() {
  const lastUpdated = 'December 18, 2024';

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
          Terms of Service
        </h1>
        <p className="text-text-secondary mb-8">
          Last Updated: {lastUpdated}
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Agreement to Terms</h2>
            <p className="text-text-secondary">
              These Terms of Service ("Terms") govern your access to and use of the Genki TCG mobile application and related services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-text-secondary mt-4">
              We reserve the right to modify these Terms at any time. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Eligibility */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Eligibility</h2>
            <p className="text-text-secondary mb-3">
              To use the Service, you must:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Be at least 13 years old</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
            <p className="text-text-secondary mt-4">
              Users under 18 should have permission from a parent or guardian to use the Service.
            </p>
          </section>

          {/* Account Registration and Security */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Account Registration and Security</h2>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Account Creation</h3>
            <p className="text-text-secondary mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Account Termination</h3>
            <p className="text-text-secondary">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in prohibited conduct. You may also delete your account at any time through the app settings.
            </p>
          </section>

          {/* User Conduct and Prohibited Activities */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">User Conduct and Prohibited Activities</h2>
            <p className="text-text-secondary mb-3">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate any person or entity</li>
              <li>Submit false tournament results or manipulate rankings</li>
              <li>Use automated tools, bots, or scripts to access the Service</li>
              <li>Attempt to gain unauthorized access to the Service or other accounts</li>
              <li>Reverse engineer, decompile, or disassemble the app</li>
              <li>Interfere with or disrupt the Service's operation</li>
              <li>Share inappropriate, offensive, or harmful content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in any form of cheating or fraud</li>
              <li>Sell, trade, or transfer your account to others</li>
            </ul>
          </section>

          {/* Tournament Participation */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Tournament Participation</h2>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Tournament Rules</h3>
            <p className="text-text-secondary mb-4">
              When participating in tournaments, you agree to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Follow all tournament rules and guidelines</li>
              <li>Report match results accurately and honestly</li>
              <li>Respect tournament organizers and their decisions</li>
              <li>Arrive on time for scheduled matches</li>
              <li>Communicate respectfully with opponents</li>
              <li>Follow game-specific rules and regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Disputes and Penalties</h3>
            <p className="text-text-secondary mb-4">
              Tournament organizers have final authority over tournament decisions. We may impose penalties for:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Match fixing or collusion</li>
              <li>Intentionally misreporting results</li>
              <li>Unsportsmanlike conduct</li>
              <li>Repeated no-shows or late arrivals</li>
            </ul>
            <p className="text-text-secondary mt-4">
              Penalties may include warnings, temporary suspensions, permanent bans, or ranking adjustments.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Intellectual Property</h2>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Our Content</h3>
            <p className="text-text-secondary mb-4">
              The Service and its original content, features, and functionality are owned by Genki TCG and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">User Content</h3>
            <p className="text-text-secondary mb-4">
              You retain ownership of content you submit (profile information, deck lists, etc.). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Use, reproduce, and display your content in the Service</li>
              <li>Store and process your content to provide the Service</li>
              <li>Create anonymized, aggregated data for analytics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Third-Party Intellectual Property</h3>
            <p className="text-text-secondary">
              Trading card game names, logos, and related intellectual property belong to their respective owners. Genki TCG is not affiliated with, endorsed by, or sponsored by any trading card game publishers.
            </p>
          </section>

          {/* Disclaimers and Limitations of Liability */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Service Availability</h3>
            <p className="text-text-secondary mb-4">
              The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not guarantee that:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>The Service will be uninterrupted or error-free</li>
              <li>All data will be accurate or complete</li>
              <li>Defects will be corrected</li>
              <li>The Service will be available at all times</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-text-primary mt-6">Limitation of Liability</h3>
            <p className="text-text-secondary mb-4">
              To the fullest extent permitted by law, Genki TCG shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Lost profits, data, or opportunities</li>
              <li>Service interruptions or data loss</li>
              <li>Actions or conduct of other users</li>
              <li>Unauthorized access to your account or data</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Indemnification</h2>
            <p className="text-text-secondary">
              You agree to indemnify, defend, and hold harmless Genki TCG, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mt-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your conduct in connection with the Service</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Third-Party Services</h2>
            <p className="text-text-secondary mb-4">
              The Service may integrate with third-party services (e.g., Discord). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Third-party service availability or performance</li>
              <li>Content or practices of third-party services</li>
              <li>Changes to third-party service terms or features</li>
            </ul>
          </section>

          {/* Modifications to the Service */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Modifications to the Service</h2>
            <p className="text-text-secondary">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          {/* Governing Law and Dispute Resolution */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Governing Law and Dispute Resolution</h2>
            <p className="text-text-secondary mb-4">
              These Terms are governed by and construed in accordance with the laws of your jurisdiction, without regard to conflict of law principles.
            </p>
            <p className="text-text-secondary mb-4">
              Any disputes arising from these Terms or the Service shall be resolved through:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Good faith negotiations between the parties</li>
              <li>Binding arbitration if negotiations fail</li>
            </ul>
            <p className="text-text-secondary mt-4">
              You agree to waive any right to a jury trial or to participate in a class action lawsuit.
            </p>
          </section>

          {/* Severability */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Severability</h2>
            <p className="text-text-secondary">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          {/* Entire Agreement */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Entire Agreement</h2>
            <p className="text-text-secondary">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Genki TCG regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          {/* Contact Information */}
          <section className="glass p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Contact Information</h2>
            <p className="text-text-secondary mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="text-text-secondary space-y-2">
              <li>Email: legal@genkitcg.app</li>
              <li>Support: support@genkitcg.app</li>
              <li>Website: https://genkitcg.app/support</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
