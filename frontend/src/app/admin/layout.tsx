import { ReactNode } from "react";

import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default async function CategoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        {children}
      </div>
    </div>
  );
}
