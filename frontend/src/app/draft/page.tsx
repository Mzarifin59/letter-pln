import { getAllEmails } from "@/lib/fetch"
import { EmailData } from "@/lib/interface"
import { cookies } from "next/headers";

import DraftPageContent from "./draft-content"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DraftPage() {
  const dataEmail : EmailData[] = await getAllEmails();

  const draftData = dataEmail.filter(item => item.surat_jalan.status_entry === "Draft");
  const token = await (await cookies()).get('token')?.value;

  return(
    <div>
      <DraftPageContent data={draftData} token={token}/>
    </div>
  )
}
