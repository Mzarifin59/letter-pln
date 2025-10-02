import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";

import RejectPageContent from "./reject-content";

export default async function RejectedPage() {
  const dataEmail: EmailData[] = await getAllEmails();

  const rejectData = dataEmail.filter(
    (item) =>
      item.surat_jalan.status_surat === "Reject" &&
      item.surat_jalan.status_entry === "Published"
  );

  return (
    <div>
      <RejectPageContent data={rejectData} />
    </div>
  );
}
