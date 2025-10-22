import InboxContentPage from "./inbox-content";

import { EmailData } from "@/lib/interface";
import { getAllEmails } from "@/lib/fetch";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InboxPage() {
  const dataEmail : EmailData[] = await getAllEmails();

  const emailInbox = dataEmail;
  const token = (await cookies()).get('token');
  return(
    <div>
      <InboxContentPage data={emailInbox} token={token?.value}/>
    </div>
  )
}
