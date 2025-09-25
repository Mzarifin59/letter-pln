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

import { EmailDetail } from "@/components/detail-email";

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
  onClick: (email: Email) => void;
}

export default function RejectedPage(): JSX.Element {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [openedEmail, setOpenedEmail] = useState<Email | null>(null);
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

  const handleEmailClick = (email: Email): void => {
    setOpenedEmail(email);
    // Mark email as read when opened
    if (email.unread) {
      // Update email unread status here if needed
    }
  };

  const handleCloseDetail = (): void => {
    setOpenedEmail(null);
  };

  const EmailRow = ({
    email,
    isSelected,
    onSelect,
    onClick,
  }: EmailRowProps): JSX.Element => {
    const isOpened = openedEmail?.id === email.id;

    return (
      <div
        className={`
          px-4 py-3 border-b border-[#ADB5BD] cursor-pointer group
          hover:bg-[#EDF1FF]
          ${isSelected ? "bg-blue-50" : ""}
          ${isOpened ? "bg-blue-100" : ""}
          flex flex-wrap items-center gap-2
        `}
        onClick={() => onClick(email)}
      >
        {/* Checkbox & Star - hidden in mobile when detail open */}
        {!openedEmail && (
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
        )}

        {/* Status */}
        {!openedEmail && (
          <div className="text-[#A62344] text-xs sm:text-sm font-semibold">
            Dibatalkan
          </div>
        )}

        {/* Sender & Preview */}
        <div className="flex-1 min-w-0">
          {openedEmail && (
            <div className="text-[#A62344] text-xs sm:text-sm font-semibold">
              Dibatalkan
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              {email.sender}
            </span>
            {!openedEmail && (
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
            )}
          </div>
          <span
            className={` text-sm text-[#545454] block ${
              openedEmail
                ? "whitespace-normal break-words"
                : "truncate xl:hidden"
            }`}
          >
            {email.preview}
          </span>
        </div>

        {/* Unread Indicator & Actions */}
        {!openedEmail && (
          <div className="flex items-center space-x-2 ml-auto">
            {email.unread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-9 overflow-hidden">
      <div className="flex flex-col xl:flex-row gap-12 lg:gap-6">
        {/* Inbox Panel */}
        <div
          className={`${
            openedEmail ? "xl:w-2/5" : "w-full"
          } transition-all duration-300`}
        >
          <div className="px-4 sm:px-6 py-5 flex flex-col bg-white rounded-xl shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="plus-jakarta-sans text-2xl sm:text-[32px] font-semibold text-[#353739]">
                  Dibatalkan
                </h1>
                <p className="plus-jakarta-sans text-xs sm:text-sm text-[#7F7F7F]">
                  2445 messages, 2 Unread
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 py-4 sm:py-[25px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {!openedEmail && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                  <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full" />
                  <span className="text-xs sm:text-sm text-gray-500">
                    1 of 200
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full" />
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-auto py-4">
              {emails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  isSelected={selectedEmails.includes(email.id)}
                  onSelect={handleSelectEmail}
                  onClick={handleEmailClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Email Detail Panel */}
        {openedEmail && (
          <div className="overflow-hidden">
          <EmailDetail
            email={openedEmail}
            handleCloseDetail={handleCloseDetail}
            isCanceled={true}
          />
          </div>
        )}
      </div>
    </div>
  );
}
