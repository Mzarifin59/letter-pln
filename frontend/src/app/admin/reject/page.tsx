import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";
import { cookies } from "next/headers";

import RejectPageContent from "./reject-content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RejectedPage() {
  const dataEmail: EmailData[] = await getAllEmails();

  const rejectData = dataEmail.filter(
    (item) =>
      item.surat_jalan.status_surat === "Reject" &&
      item.surat_jalan.status_entry === "Published"
  );

  const token = (await cookies()).get('token');

  return (
    <div>
      <RejectPageContent data={rejectData} token={token?.value}/>
    </div>
  );
}
