import InboxContentPage from "./inbox-content";

import { EmailData } from "@/lib/interface";
import { getAllEmails } from "@/lib/fetch";

export default async function InboxPage() {
  const dataEmail : EmailData[] = await getAllEmails();
  return(
    <div>
      <InboxContentPage data={dataEmail}/>
    </div>
  )
}
