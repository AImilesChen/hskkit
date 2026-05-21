import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | HSKKit", description: "HSKKit privacy policy draft." };

export default function PrivacyPolicyPage() {
  return (
    <main className="section">
      <h1>Privacy Policy</h1>
      <p>Last updated: 2026-05-21</p>
      <p>This is a working draft for HSKKit. HSKKit may collect account information, payment status, usage data, and user-submitted learning prompts to provide AI-powered study tools.</p>
      <p>Payments are planned through PayPal. HSKKit does not store full card details. AI-generated learning materials may be processed by third-party AI providers.</p>
      <p>Contact: <a href="mailto:support@hskkit.com">support@hskkit.com</a></p>
    </main>
  );
}
