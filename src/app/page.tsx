import { redirect } from 'next/navigation';

// Root URL — redirect visitors to the Max Marketing Firm website
export default function RootPage() {
  redirect('https://maxmarketingfirm.com');
}
