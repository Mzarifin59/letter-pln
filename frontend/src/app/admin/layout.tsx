import { ReactNode } from "react";

import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { getAllEmails } from "@/lib/fetch";
import { EmailData } from "@/lib/interface";
import { cookies } from "next/headers";

export default async function CategoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const dataEmail: EmailData[] = await getAllEmails();
  const token = await (await cookies()).get('token')?.value;
  return (
    <div className="flex">
      <Sidebar data={dataEmail} token={`${token}`}/>
      <div className="flex-1">
        <Header />
        {children}
      </div>
    </div>
  );
}
