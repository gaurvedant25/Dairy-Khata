import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Terms & Conditions · Dairy Ledger" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        By creating an account or using Dairy Ledger (the &quot;Service&quot;), you agree to these Terms.
      </p>

      <h2>The service</h2>
      <p>
        Dairy Ledger is a free tool that helps milk delivery businesses record deliveries, track dues,
        and manage customers. You are responsible for the accuracy of the data you enter.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for keeping your login secure and for all activity under your account.
      </p>

      <h2>Price</h2>
      <p>
        The Service is free to use. There are no subscriptions or charges.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to misuse the Service, attempt to disrupt it, or use it for unlawful purposes.
      </p>

      <h2>Liability</h2>
      <p>
        The Service is provided on an &quot;as is&quot; basis. To the extent permitted by law, we are not liable
        for indirect or consequential losses arising from use of the Service.
      </p>

      <h2>Contact</h2>
      <p>Questions about these Terms: gaurvedant479@gmail.com.</p>
    </LegalPage>
  );
}
