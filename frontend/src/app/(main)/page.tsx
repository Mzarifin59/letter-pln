import DashboardContentPage from "@/components/dashboard-content";

import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const emails: EmailData[] = await getAllEmails();
  return (
    <div>
      <DashboardContentPage allData={emails} />
    </div>
  );
}
