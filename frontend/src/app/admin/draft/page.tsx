import { getAllEmails } from "@/lib/fetch"
import { EmailData } from "@/lib/interface"

import DraftPageContent from "./draft-content"

export default async function DraftPage() {
  const dataEmail : EmailData[] = await getAllEmails();

  const draftData = dataEmail.filter(item => item.surat_jalan.status_entry === "Draft");

  console.log(draftData)

  return(
    <div>
      <DraftPageContent data={draftData}/>
    </div>
  )
}
