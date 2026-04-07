import CheckoutPageClient from "./CheckoutPageClient";

type Props = {
  searchParams: Promise<{
    mp_status?: string;
  }>;
};

export default async function CheckoutPage(props: Props) {
  const sp = await props.searchParams;
  const mpStatus = sp.mp_status;

  return <CheckoutPageClient mpStatus={mpStatus} />;
}





