import TopBar from "@/components/top-bar";
import { Footer } from "@/components/landing/footer";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <TopBar />

      <main className="container max-w-4xl mx-auto px-6 py-24 md:py-32">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Effective Date: February 14, 2026
          </p>
        </div>

        <Separator className="my-8" />

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
          <section>
            <p className="lead text-xl leading-relaxed">
              At Niana, we take your privacy seriously. This policy details how
              we collect, use, and protect your personal information and project
              data. We are committed to transparency and ensuring your data
              remains secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              1. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us or that is
              generated during your use of our application:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>
                <strong className="text-foreground">
                  Account Information:
                </strong>{" "}
                Name, email address, and profile details provided securely via
                our authentication provider, <strong>WorkOS</strong>.
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong>{" "}
                Information on how you interact with our editor, including
                feature usage and session patterns to improve the UI/UX.
              </li>
              <li>
                <strong className="text-foreground">
                  Payment Information:
                </strong>{" "}
                Transaction details for premium subscriptions are processed
                securely via <strong>Polar</strong> and{" "}
                <strong>Razorpay</strong>. We strictly do not store credit card
                numbers or sensitive financial details on our servers.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              2. How We Use Your Information
            </h2>
            <p>
              We use the collected information for the following specific
              purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>
                <strong className="text-foreground">Service Delivery:</strong>{" "}
                To provide, maintain, and personalize your design workspace.
              </li>
              <li>
                <strong className="text-foreground">
                  AI Feature Functionality:
                </strong>{" "}
                To process your inputs and generate high-fidelity app designs
                and code using our AI models.
              </li>
              <li>
                <strong className="text-foreground">
                  Product Improvement:
                </strong>{" "}
                To analyze usage trends and fix bugs to ensure a seamless
                "prompt-to-app-screen" experience.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              3. Data Storage and Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              intellectual property and personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>
                <strong className="text-foreground">Encryption:</strong> Data is
                encrypted both in transit (SSL/TLS) and at rest.
              </li>
              <li>
                <strong className="text-foreground">
                  Secure Infrastructure:
                </strong>{" "}
                We utilize secure cloud providers (like Convex) with strict
                access controls.
              </li>
              <li>
                <strong className="text-foreground">Minimal Access:</strong>{" "}
                Only authorized personnel have access to backend systems for
                support and maintenance purposes.
              </li>
              <li>
                <strong className="text-foreground">No Backend Details:</strong>{" "}
                We do not require or store sensitive backend credentials of your
                external integrations.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
            <p>
              We partner with trusted third-party services to power our
              application. We share data with them only as necessary to provide
              our services:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>
                <strong className="text-foreground">Authentication:</strong>{" "}
                <strong>WorkOS</strong> handles secure, enterprise-grade login
                and identity management.
              </li>
              <li>
                <strong className="text-foreground">Payments:</strong>{" "}
                <strong>Polar</strong> and <strong>Razorpay</strong> manage
                secure billing, subscriptions, and payment processing.
              </li>
              <li>
                <strong className="text-foreground">Analytics:</strong> We use
                tools (like Vercel Analytics) to help us understand anonymous
                user behavior and improve the app's performance.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Your Rights & Control</h2>
            <p>
              You maintain full control over your data. You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>
                <strong className="text-foreground">Access & Export:</strong>{" "}
                Request a copy of your personal data and design projects.
              </li>
              <li>
                <strong className="text-foreground">Rectification:</strong>{" "}
                Correct any inaccurate information in your profile.
              </li>
              <li>
                <strong className="text-foreground">Withdraw Consent:</strong>{" "}
                Opt-out of non-essential data collection at any time.
              </li>
            </ul>
          </section>

          <section className="pt-8 border-t border-border">
            <p className="font-medium text-lg text-foreground">
              We never sell or share your personal details with anyone else for
              marketing purposes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
