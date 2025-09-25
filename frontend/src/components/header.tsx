"use client";

import { useState } from "react";
import {
  Search,
  SlidersVertical,
  CircleHelp,
  Settings,
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="lg:ml-72 flex-1 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left Section - Mobile Menu + Search */}
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile Menu Button - hanya muncul di bawah lg */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-gray-500 hover:text-[#0056B0] hover:bg-[#F2F5FE] rounded-lg transition-all">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="hidden">Menu</SheetTitle>
                <SidebarContent onItemClick={closeSheet} />
              </SheetContent>
            </Sheet>

            {/* Search Section */}
            <div className="flex items-center gap-3 bg-[#F6F9FF] rounded-xl px-4 py-3 flex-1 max-w-md">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search All"
                className="bg-transparent border-none outline-none flex-1 text-gray-700 placeholder-gray-500"
              />
              <div className="h-5 w-px bg-[#0056B0] mx-2"></div>
              <button className="text-gray-500 hover:text-[#0056B0] transition-colors">
                <SlidersVertical size={20} />
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Action Icons */}
            <div className="hidden md:flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-[#0056B0] hover:bg-[#F2F5FE] rounded-lg transition-all">
                <CircleHelp size={20} />
              </button>
              <button className="p-2 text-gray-500 hover:text-[#0056B0] hover:bg-[#F2F5FE] rounded-lg transition-all">
                <Settings size={20} />
              </button>
              <button className="p-2 text-gray-500 hover:text-[#0056B0] hover:bg-[#F2F5FE] rounded-lg transition-all">
                <Bell size={20} />
              </button>
            </div>

            {/* Divider - hidden di mobile */}
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors group">
              <div className="w-10 h-10 bg-[#0056B0] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                AG
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="text-sm font-medium text-gray-800">
                  Admin Gudang
                </p>
                <p className="text-xs text-gray-500">marco@goodmail.io</p>
              </div>
              <ChevronDown
                size={16}
                className="hidden sm:block text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}