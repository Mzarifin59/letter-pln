"use client";

import { useState, useEffect } from "react";
import { EmailData } from "@/lib/interface";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SidebarContent from "./sidebar-content";

interface SidebarProps {
  data: EmailData[];
  token: string | undefined;
  onItemClick?: () => void;
}

export default function Sidebar({ data, token, onItemClick }: SidebarProps) {
  const [emailData, setEmailData] = useState<EmailData[]>(data);
  const [open, setOpen] = useState(false);

  // Update data ketika props berubah
  useEffect(() => {
    setEmailData(data);
  }, [data]);


  // Function untuk update email status
  const updateEmailStatus = (emailId: number) => {
    setEmailData((prevData) =>
      prevData.map((email) => {
        if (email.id === emailId) {
          return {
            ...email,
            email_statuses: email.email_statuses?.map((status) => ({
              ...status,
              is_read: true,
            })),
          };
        }
        return email;
      })
    );
  };

  // Listen untuk event custom dari detail email
  useEffect(() => {
    const handleEmailRead = (event: CustomEvent) => {
      updateEmailStatus(event.detail.emailId);
    };

    window.addEventListener("emailRead", handleEmailRead as EventListener);

    return () => {
      window.removeEventListener("emailRead", handleEmailRead as EventListener);
    };
  }, []);

  return (
    <>
      {/* ✅ Sidebar versi desktop */}
      <div className="hidden lg:fixed left-0 top-0 max-w-2xs h-screen bg-white border-r border-gray-200 lg:flex flex-col z-10">
        <SidebarContent data={data} token={token} />
      </div>

      {/* ✅ Tombol untuk mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md border border-gray-300 bg-white shadow hover:bg-gray-50 transition"
              aria-label="Buka menu sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[60%] sm:w-[300px] p-0 bg-white border-r border-gray-200"
          >
            <SheetHeader className="hidden">
              <SheetTitle className="sr-only hidden">Menu Sidebar</SheetTitle>
            </SheetHeader>

            <SidebarContent data={data} token={token} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}