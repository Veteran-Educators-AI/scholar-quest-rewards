import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/auth">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 11, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scholar Quest ("we," "our," or "us") is committed to protecting the privacy of students, parents, and educators who use our educational platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. FERPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              We comply with the Family Educational Rights and Privacy Act (FERPA). As a school official with a legitimate educational interest, we:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Only collect information necessary for educational purposes</li>
              <li>Maintain student education records confidentially</li>
              <li>Allow parents/guardians to review their child's records upon request</li>
              <li>Do not disclose personally identifiable information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. COPPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              For children under 13, we comply with the Children's Online Privacy Protection Act (COPPA):
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Parental consent is required for account creation</li>
              <li>We collect only information necessary for educational activities</li>
              <li>Parents can review, modify, or delete their child's information</li>
              <li>We do not condition participation on disclosure of unnecessary information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following types of information:</p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Name and email address</li>
              <li>Role (student, teacher, parent)</li>
              <li>School affiliation</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Educational Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Assignment submissions and grades</li>
              <li>Learning progress and achievements</li>
              <li>Class enrollment information</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Technical Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Device and browser information</li>
              <li>Usage analytics for platform improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Provide and personalize educational services</li>
              <li>Track student progress and achievements</li>
              <li>Enable teacher-student-parent communication</li>
              <li>Improve our platform and educational offerings</li>
              <li>Ensure platform security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">We do not sell student data. We may share information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Teachers and school administrators for educational purposes</li>
              <li>Parents/guardians of their own children</li>
              <li>Service providers who assist in platform operation (under strict confidentiality)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption, secure data storage, access controls, and regular security audits. While we strive to protect your information, no electronic transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain student data only as long as necessary for educational purposes or as required by law. Upon request, we will delete student accounts and associated data within 30 days, except where retention is required for legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of non-essential communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or to exercise your rights, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: privacy@scholarquest.edu<br />
              Address: Scholar Quest Privacy Team
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify users of significant changes via email or in-app notification. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
