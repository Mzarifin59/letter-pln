"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EmailData } from "@/lib/interface";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SidebarContent from "./sidebar-content";
import qs from "qs";

interface SidebarProps {
  data: EmailData[];
  token: string | undefined;
  onItemClick?: () => void;
}

async function getEmail() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = qs.stringify({
    sort: ["createdAt:asc"],
    populate: {
      surat_jalan: {
        populate: {
          materials: true,
          penerima: {
            fields: ["perusahaan_penerima", "nama_penerima"],
            populate: {
              ttd_penerima: {
                fields: ["name", "url"],
              },
            },
          },
          pengirim: {
            fields: ["departemen_pengirim", "nama_pengirim"],
            populate: {
              ttd_pengirim: {
                fields: ["name", "url"],
              },
            },
          },
          lampiran: {
            fields: ["name", "url"],
          },
        },
      },
      sender: {
        fields: ["name", "email"],
      },
      recipient: {
        fields: ["name", "email"],
      },
      email_statuses: {
        fields: ["is_read", "is_bookmarked", "read_at", "bookmarked_at"],
        populate: {
          user: {
            fields: ["name", "email"],
          },
        },
      },
      attachment_files: {
        fields: ["name", "url"],
      },
    },
  });

  const res = await fetch(`${apiUrl}/api/emails?${query}`);
  const data = await res.json();
  return data.data;
}

export default function Sidebar({ data: initialData, token }: SidebarProps) {
  const [emailData, setEmailData] = useState<EmailData[]>(initialData);
  const [open, setOpen] = useState(false);
  
  // Refs untuk polling management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMountedRef = useRef<boolean>(true);

  // Memoized fetch function untuk realtime updates
  const fetchEmails = useCallback(async () => {
    try {
      const data = await getEmail();
      
      // Hanya update jika component masih mounted
      if (isComponentMountedRef.current) {
        setEmailData(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching emails:", err);
      } else {
        console.error("Unknown error:", err);
      }
    }
  }, []);

  // Setup realtime polling
  useEffect(() => {
    isComponentMountedRef.current = true;

    // Initial fetch untuk sync dengan data terbaru
    fetchEmails();

    // Setup polling - fetch setiap 10 detik
    pollingIntervalRef.current = setInterval(() => {
      fetchEmails();
    }, 10000); // 10 detik

    // Cleanup function
    return () => {
      isComponentMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchEmails]);

  // Fetch saat tab menjadi visible lagi (untuk mobile/multi-tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isComponentMountedRef.current) {
        fetchEmails();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchEmails]);

  // Update data ketika props berubah (fallback)
  useEffect(() => {
    setEmailData(initialData);
  }, [initialData]);

  // Function untuk update email status (local optimistic update)
  const updateEmailStatus = useCallback((emailId: number) => {
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

    // Fetch ulang untuk sync dengan server (delay kecil untuk menghindari race condition)
    setTimeout(() => {
      fetchEmails();
    }, 0.5);
  }, [fetchEmails]);

  // Listen untuk event custom dari detail email
  useEffect(() => {
    const handleEmailRead = (event: CustomEvent) => {
      updateEmailStatus(event.detail.emailId);
    };

    const handleEmailCreated = () => {
      // Refresh data ketika surat baru dibuat
      fetchEmails();
    };

    window.addEventListener("emailRead", handleEmailRead as EventListener);
    window.addEventListener("emailCreated", handleEmailCreated as EventListener);

    return () => {
      window.removeEventListener("emailRead", handleEmailRead as EventListener);
      window.removeEventListener("emailCreated", handleEmailCreated as EventListener);
    };
  }, [fetchEmails, updateEmailStatus]);

  return (
    <>
      {/* ✅ Sidebar versi desktop */}
      <div className="hidden lg:fixed left-0 top-0 max-w-2xs h-screen bg-white border-r border-gray-200 lg:flex flex-col z-10">
        <SidebarContent data={emailData} token={token} />
      </div>

      {/* ✅ Tombol untuk mobile */}
      <div className="lg:hidden fixed bottom-3 left-4 z-20">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="p-3 rounded-md border border-[#0056B0]  bg-[#0056B0] shadow hover:bg-[#0056B0]/90 transition"
              aria-label="Buka menu sidebar"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[60%] sm:w-[300px] p-0 bg-white border-r border-gray-200"
          >
            <SheetHeader className="hidden">
              <SheetTitle className="sr-only hidden">Menu Sidebar</SheetTitle>
            </SheetHeader>

            <SidebarContent data={emailData} token={token}/>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}