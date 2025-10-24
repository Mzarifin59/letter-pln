import { getAllEmails } from "@/lib/fetch";

import TrackingContentPage from "./tracking-content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TrackingPage() {
  const emailData = await getAllEmails();
  return (
    <div>
      <TrackingContentPage data={emailData}/>
    </div>
  );
}
