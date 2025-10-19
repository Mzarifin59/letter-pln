import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";

import TrackingContentPage from "./tracking-content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TrackingPage() {
  const emailData : EmailData[] = await getAllEmails();
  return (
    <div>
      <TrackingContentPage data={emailData}/>
    </div>
  );
}
