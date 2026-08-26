import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy · Dairy Ledger" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains how Dairy Ledger (&quot;we&quot;, &quot;us&quot;) handles your information
        when you use our app and website.
      </p>

      <h2>Information we collect</h2>
      <p>
        Account details you provide (name, email) and the business data you enter (your customers, deliveries,
        payments, and items). We do not sell your data.
      </p>

      <h2>How we use it</h2>
      <p>
        Solely to provide the service — storing and displaying your ledger, calculating dues, and managing your
        subscription. Payment processing is handled by our payment provider; we do not store your card or bank
        details.
      </p>

      <h2>Data storage</h2>
      <p>
        Your data is stored securely with our hosting and database providers. We take reasonable measures to
        protect it against unauthorised access.
      </p>

      <h2>Your choices</h2>
      <p>
        You can edit or delete your data within the app. To delete your account or request data removal, contact
        us at gaurvedant479@gmail.com.
      </p>

      <h2>Contact</h2>
      <p>For any privacy questions, email gaurvedant479@gmail.com.</p>
    </LegalPage>
  );
}
