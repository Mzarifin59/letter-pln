"use client";

import { JSX, useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Star,
  Trash2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// Type definitions
interface Email {
  id: number;
  sender: string;
  avatar: string;
  avatarBg: string;
  subject: string;
  preview: string;
  time: string;
  shortTime: string;
  starred: boolean;
  attachments: string[];
  unread: boolean;
}

interface EmailRowProps {
  email: Email;
  isSelected: boolean;
  onSelect: (emailId: number) => void;
  onClick?: (email: Email) => void;
}

interface SectionHeaderProps {
  title: string;
  count: string;
  isExpanded?: boolean;
}

interface GroupedEmails {
  today: Email[];
  yesterday: Email[];
  wednesday: Email[];
}

export default function DraftPage(): JSX.Element {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const emails: Email[] = [
    {
      id: 1,
      sender: "Gardu Induk Cigereleng",
      avatar: "GI",
      avatarBg: "bg-blue-600",
      subject: "Surat jalan",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: true,
      attachments: ["SJ.01/Vendor.pdf", "SJ.02/Vendor.pdf"],
      unread: true,
    },
    {
      id: 2,
      sender: "Gardu Induk Bandung Utara",
      avatar: "GI",
      avatarBg: "bg-blue-600",
      subject: "Surat jalan",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: false,
      attachments: [],
      unread: false,
    },
    {
      id: 3,

      sender: "Vendor Truck",
      avatar: "VT",
      avatarBg: "bg-orange-400",
      subject: "Berita Acara",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: false,
      attachments: [],
      unread: true,
    },
    {
      id: 4,
      sender: "Gardu Induk Cigereleng",
      avatar: "GI",
      avatarBg: "bg-blue-600",
      subject: "Surat jalan",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: true,
      attachments: [],
      unread: true,
    },
    {
      id: 5,
      sender: "Gardu Induk Bandung Utara",
      avatar: "GI",
      avatarBg: "bg-blue-600",
      subject: "Surat jalan",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: false,
      attachments: [],
      unread: false,
    },
    {
      id: 6,
      sender: "Vendor Truck",
      avatar: "VT",
      avatarBg: "bg-orange-400",
      subject: "Berita Acara",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: false,
      attachments: [],
      unread: true,
    },
    {
      id: 7,
      sender: "Gardu Induk Cigereleng",
      avatar: "GI",
      avatarBg: "bg-blue-600",
      subject: "Surat jalan",
      preview: "Pemakaian Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: true,
      attachments: [],
      unread: true,
    },
    {
      id: 8,
      sender: "Vendor Jaya Kusuma",
      avatar: "VJ",
      avatarBg: "bg-orange-400",
      subject: "Surat teknis",
      preview: "Permohonan Material Kabel Kontrol Untuk GI BDutara...",
      time: "29 September 2025, 19:00 WIB",
      shortTime: "29 Sep",
      starred: false,
      attachments: [],
      unread: true,
    },
  ];

  const handleSelectAll = (): void => {
    if (selectAll) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map((email) => email.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectEmail = (emailId: number): void => {
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter((id) => id !== emailId));
    } else {
      setSelectedEmails([...selectedEmails, emailId]);
    }
  };

  const EmailRow = ({
    email,
    isSelected,
    onSelect,
    onClick,
  }: EmailRowProps): JSX.Element => {
    return (
      <div
        className={`
            px-4 py-3 border-b border-[#ADB5BD] cursor-pointer group
            hover:bg-[#EDF1FF]
            ${isSelected ? "bg-blue-50" : ""}
            flex flex-wrap items-center gap-2
          `}
      >
        {/* Checkbox & Star - hidden in mobile when detail open */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(email.id)}
            className="rounded border-gray-300"
          />
          <Star
            className={`w-4 h-4 fill-current ${
              email.starred ? "text-yellow-400" : "text-[#E9E9E9]"
            }`}
          />
        </div>

        {/* Status */}
        <div className="text-[#A62344] text-xs sm:text-sm font-semibold">
          Dibatalkan
        </div>

        {/* Sender & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              {email.sender}
            </span>
            <>
              <span
                className={`max-xl:hidden jtext-sm text-[#545454] block whitespace-normal break-words`}
              >
                {email.preview}
              </span>
              <span className="max-sm:hidden text-[10px] sm:text-xs text-gray-500 ml-2 flex-shrink-0">
                {email.time}
              </span>
              <span className="sm:hidden text-[10px] sm:text-xs text-gray-500 ml-2 flex-shrink-0">
                {email.shortTime}
              </span>
            </>
          </div>
          <span
            className={` text-sm text-[#545454] block whitespace-normal break-words truncate xl:hidden`}
          >
            {email.preview}
          </span>
        </div>

        {/* Unread Indicator & Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          {email.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const SectionHeader = ({
    title,
    count,
    isExpanded = true,
  }: SectionHeaderProps): JSX.Element => (
    <div className="flex items-center px-4 py-2">
      <input type="checkbox" className="mr-3 rounded border-gray-300" />
      <ChevronDown
        className={`w-4 h-4 text-gray-500 mr-2 transition-transform ${
          !isExpanded ? "-rotate-90" : ""
        }`}
      />
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <span className="text-sm text-gray-500 ml-2">{count}</span>
    </div>
  );

  return (
    <div className="lg:ml-72 bg-[#F6F9FF] p-9">
      <div className="flex flex-col bg-white rounded-xl shadow-md">
        {/* Header */}
        <div className="px-[43px] pt-[25px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="plus-jakarta-sans text-[32px] font-semibold text-[#353739]">
                Draft
              </h1>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-[#7F7F7F4D]">
          <div className="flex items-center justify-between px-[43px] py-[25px]">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 w-5 h-5"
                />
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>

              <RotateCw
                width={20}
                height={20}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              />
              <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
            </div>

            <div className="flex items-center space-x-2">
              <ArrowLeft
                width={20}
                height={20}
                className="hover:text-gray-400 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full"
              />
              <span className="text-sm text-gray-500">1 of 200</span>
              <ArrowRight
                width={20}
                height={20}
                className="hover:text-gray-400 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto px-[43px] py-[25px]">
          {/* Today Section */}
          <div className="mb-6">
            {emails.map((email: Email) => (
              <EmailRow
                key={email.id}
                email={email}
                isSelected={selectedEmails.includes(email.id)}
                onSelect={handleSelectEmail}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
