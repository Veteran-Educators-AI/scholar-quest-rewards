import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/auth">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 11, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Scholar Quest ("the Platform"), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of a school or organization, you represent that you have authority to bind that entity to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scholar Quest is an educational gamification platform designed to motivate K-12 students through rewards, achievements, and progress tracking. The Platform provides tools for students, teachers, and parents to engage with educational content and monitor academic progress.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-2">3.1 Account Types</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Student Accounts:</strong> For K-12 students to access assignments and earn rewards</li>
              <li><strong>Teacher Accounts:</strong> For educators to manage classes and assignments</li>
              <li><strong>Parent Accounts:</strong> For guardians to monitor student progress</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">3.2 Account Responsibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">3.3 Minor Users</h3>
            <p className="text-muted-foreground leading-relaxed">
              Students under 13 require parental consent for account creation. Parents/guardians are responsible for their child's use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Share account credentials or impersonate others</li>
              <li>Submit work that is not your own (plagiarism/cheating)</li>
              <li>Upload inappropriate, harmful, or illegal content</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Use the Platform for commercial purposes without authorization</li>
              <li>Interfere with Platform operation or security</li>
              <li>Harass, bully, or harm other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Educational Content</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-2">5.1 Teacher Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              Teachers retain ownership of educational materials they create. By uploading content, teachers grant Scholar Quest a license to display and distribute content within the Platform for educational purposes.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">5.2 Student Submissions</h3>
            <p className="text-muted-foreground leading-relaxed">
              Students retain ownership of their original work. Student submissions may be reviewed by teachers and parents with appropriate access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Rewards and Virtual Currency</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coins, XP, badges, and other virtual rewards have no monetary value and cannot be exchanged for real currency. Rewards are for motivational purposes only and remain property of Scholar Quest. We reserve the right to modify the rewards system at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and protect your information. By using the Platform, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform, including its design, features, and content (excluding user-generated content), is owned by Scholar Quest and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted access, error-free operation, or specific educational outcomes. Scholar Quest supplements but does not replace traditional education.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Scholar Quest shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate accounts that violate these Terms. Users may request account deletion at any time. Upon termination, you lose access to the Platform and any accumulated rewards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. Significant changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by applicable laws. Any disputes shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: legal@scholarquest.edu<br />
              Address: Scholar Quest Legal Team
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
