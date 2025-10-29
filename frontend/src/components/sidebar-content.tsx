"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmailData } from "@/lib/interface";

import { Button } from "@/components/ui/button";
import {
  Plus,
  LayoutGrid,
  Inbox,
  CheckSquare,
  StickyNote,
  Send,
  ArchiveX,
} from "lucide-react";
import { useUserLogin } from "@/lib/user";
import { useMemo } from "react";

interface SidebarContentProps {
  data: EmailData[];
  token: string | undefined;
  onItemClick?: () => void;
}

export default function SidebarContent({
  data,
  token,
  onItemClick,
}: SidebarContentProps) {
  const { user } = useUserLogin();
  const pathname = usePathname();

  const Spv = user?.role?.name === "Spv";

  console.log("Data: ", data)

  // Memoize filtered data untuk performa
  const getFilteredData = useMemo(() => {
    return (filterType: string) => {
      return data.filter((item) => {
        const userEmailStatus = item.email_statuses?.find(
          (emailStatus) => emailStatus.user.name === user?.name
        );

        if (!userEmailStatus) return false;

        const isPublished = item.surat_jalan?.status_entry === "Published";

        switch (filterType) {
          case "inbox":
            return (
              isPublished &&
              userEmailStatus.is_read === false
            );

          case "tracking":
            return (
              isPublished && item.surat_jalan.status_surat === "In Progress"
            );

          case "draft":
            return (
              item.surat_jalan.status_entry === "Draft" &&
              userEmailStatus.is_read === false
            );

          case "sent":
            return (
              isPublished &&
              item.surat_jalan.status_surat === "In Progress" &&
              userEmailStatus.is_read === false
            );

          case "reject":
            return (
              isPublished &&
              item.surat_jalan.status_surat === "Reject" &&
              userEmailStatus.is_read === false
            );

          default:
            return false;
        }
      });
    };
  }, [data, user?.name, user?.role]);

  const navItems = useMemo(() => {
    const allItems = [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutGrid,
        id: "home",
        count: 0,
      },
      {
        href: "/inbox",
        label: "Inbox",
        icon: Inbox,
        id: "inbox",
        count: getFilteredData("inbox").length,
      },
      {
        href: "/tracking",
        label: "Tracking",
        icon: CheckSquare,
        id: "tracking",
        count: 0,
      },
      {
        href: "/draft",
        label: "Drafts",
        icon: StickyNote,
        id: "draft",
        count: 0,
        hideForRoles: ["Spv"],
      },
      {
        href: "/sent",
        label: "Sent",
        icon: Send,
        id: "sent",
        count: getFilteredData("sent").length,
        hideForRoles: ["Spv"],
      },
      {
        href: "/reject",
        label: "Dibatalkan",
        icon: ArchiveX,
        id: "reject",
        count: getFilteredData("reject").length,
        hideForRoles: ["Spv"],
      },
    ];

    // Filter berdasarkan role user
    return allItems.filter((item) => {
      if (item.hideForRoles && user?.role) {
        return !item.hideForRoles.includes(user.role.name);
      }
      return true;
    });
  }, [getFilteredData, user?.role]);

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center mb-6">
          <Image
            src={`/images/PLN-logo.png`}
            alt="PLN Logo"
            width={62}
            height={62}
            className="w-[62px] h-[62px] object-cover flex-shrink-0"
          />
          <div className="flex flex-col">
            <h2 className="text-[#003367] text-lg font-extrabold leading-tight">
              SIGASPOL
            </h2>
            <p className="text-[#003367] text-[8px] leading-tight mt-1">
              Aplikasi Gudang Surat jalan dan Pengelolaan Bongkaran Logistik
            </p>
          </div>
        </div>

        {user?.role?.name === "Admin" &&  (
          <Link href={`/create-letter`} onClick={handleItemClick}>
            <Button className="w-full flex items-center justify-center gap-2 bg-[#0056B0] hover:bg-[#004494] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer">
              <Plus size={18} />
              Buat Surat
            </Button>
          </Link>
        )}

        {user?.role?.name === "Vendor" &&  (
          <Link href={`/create-letter`} onClick={handleItemClick}>
            <Button className="w-full flex items-center justify-center gap-2 bg-[#0056B0] hover:bg-[#004494] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer">
              <Plus size={18} />
              Buat Surat Bongkaran
            </Button>
          </Link>
        )}
      </div>

      

      {/* Navigation Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon, count }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleItemClick}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-[#F2F5FE] text-[#0056B0]"
                    : "text-gray-700 hover:text-[#0056B0] hover:bg-[#F2F5FE]"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors ${
                    active
                      ? "text-[#0056B0]"
                      : "text-gray-500 group-hover:text-[#0056B0]"
                  }`}
                />
                <span className="plus-jakarta-sans font-medium flex-1">
                  {label}
                </span>

                {/* Badge Notifikasi dengan animasi pulse */}
                {count > 0 && (
                  <span
                    className={`min-w-[24px] h-6 px-2 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                      active
                        ? "bg-[#0056B0] text-white "
                        : "bg-[#E0E7FF] text-[#0056B0]"
                    }`}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          © 2025 PLN - SIGASPOL
        </div>
      </div>
    </div>
  );
}
