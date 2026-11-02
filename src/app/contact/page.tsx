import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Contact · Dairy Ledger" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>Questions or need help? Reach us at:</p>
      <p>
        <strong>Email:</strong> gaurvedant479@gmail.com
        <br />
        <strong>Phone:</strong> +91-XXXXXXXXXX
        <br />
        <strong>Address:</strong> [Your city, State, India]
      </p>
      <p>We usually reply within 1–2 business days.</p>
    </LegalPage>
  );
}
