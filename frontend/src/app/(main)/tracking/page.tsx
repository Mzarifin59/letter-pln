import { getAllEmails } from "@/lib/fetch";

import TrackingContentPage from "./tracking-content";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TrackingPage() {
  const emailData = await getAllEmails();
  const token = (await cookies()).get('token');
  return (
    <div>
      <TrackingContentPage data={emailData} token={token?.value}/>
    </div>
  );
}
