"use client";

import { useState, useEffect } from "react";
import { EmailData } from "@/lib/interface";
import SidebarContent from "./sidebar-content";

interface SidebarProps {
  data: EmailData[];
  token: string | undefined;
}

export default function Sidebar({ data, token }: SidebarProps) {
  const [emailData, setEmailData] = useState<EmailData[]>(data);

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
    <div className="hidden lg:fixed left-0 top-0 max-w-2xs h-screen bg-white border-r border-gray-200 lg:flex flex-col z-10">
      <SidebarContent data={emailData} token={token} />
    </div>
  );
}