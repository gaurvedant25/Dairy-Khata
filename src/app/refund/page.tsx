import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Cancellation & Refund Policy · Dairy Ledger" };

export default function RefundPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy">
      <h2>Free trial</h2>
      <p>
        Every new account starts with a 14-day free trial. You are not charged during the trial and can cancel
        anytime before it ends without any payment.
      </p>

      <h2>Subscription &amp; billing</h2>
      <p>
        After the trial, the subscription is ₹249 per month. Payment is collected at the start of each billing
        cycle.
      </p>

      <h2>Cancellation</h2>
      <p>
        You can cancel your subscription at any time from Settings → Your subscription. On cancellation, your
        access continues until the end of the current billing period and does not renew after that. No further
        charges are made once cancelled.
      </p>

      <h2>Refunds</h2>
      <p>
        As the service is offered with a 14-day free trial to evaluate it fully, monthly subscription fees are
        generally non-refundable once a billing cycle has started. If you were charged in error or experienced a
        technical issue that prevented use of the service, contact us at gaurvedant479@gmail.com within 7 days and
        we will review and process an appropriate refund where applicable.
      </p>
    </LegalPage>
  );
}
