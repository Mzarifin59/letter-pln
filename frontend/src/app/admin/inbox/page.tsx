import InboxContentPage from "./inbox-content";

import { EmailData } from "@/lib/interface";
import { getAllEmails } from "@/lib/fetch";

export default async function InboxPage() {
  const dataEmail : EmailData[] = await getAllEmails();

  const emailInbox = dataEmail.filter(item => item.recipient.name === "Admin Gudang")
  return(
    <div>
      <InboxContentPage data={emailInbox}/>
    </div>
  )
}
