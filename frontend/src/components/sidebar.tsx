"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

// Komponen untuk konten sidebar yang bisa digunakan ulang
export function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/inbox", label: "Inbox", icon: Inbox },
    { href: "/admin/tracking", label: "Persetujuan", icon: CheckSquare },
    { href: "/admin/draft", label: "Draft", icon: StickyNote },
    { href: "/admin/sent", label: "Terkirim", icon: Send },
    { href: "/admin/reject", label: "Dibatalkan", icon: ArchiveX },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleItemClick = () => {
    onItemClick?.(); // Menutup sheet ketika item diklik
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

        <Link href={`/admin/create-letter`} onClick={handleItemClick}>
          <Button className="w-full flex items-center justify-center gap-2 bg-[#0056B0] hover:bg-[#004494] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer">
            <Plus size={18} />
            Buat Surat
          </Button>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
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
                <span className="plus-jakarta-sans font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          © 2024 PLN - SIGASPOL
        </div>
      </div>
    </div>
  );
}

// Sidebar untuk desktop (lg ke atas)
export default function Sidebar() {
  return (
    <div className="hidden lg:fixed left-0 top-0 max-w-2xs h-screen bg-white border-r border-gray-200 lg:flex flex-col z-10">
      <SidebarContent />
    </div>
  );
}