import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";

import SentContent from "./sent-content";

export default async function SentPage() {
  const dataEmail: EmailData[] = await getAllEmails();

  const sentData = dataEmail.filter(
    (item) =>
      item.surat_jalan.status_surat === "In Progress" &&
      item.surat_jalan.status_entry === "Published"
  );
  return (
    <div>
      <SentContent data={sentData}/>
    </div>
  );
}
