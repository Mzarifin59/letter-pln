"use client";

import { JSX, useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Star,
  Trash2,
  Calendar,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { EmailDetail } from "@/components/detail-email";

// Type definitions
interface Email {
  id: number;
  type: "today" | "yesterday" | "wednesday";
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

export default function InboxPage(): JSX.Element {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [openedEmail, setOpenedEmail] = useState<Email | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const emails: Email[] = [
    {
      id: 1,
      type: "today",
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
      type: "today",
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
      type: "today",
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
      type: "yesterday",
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
      type: "yesterday",
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
      type: "yesterday",
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
      type: "wednesday",
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
      type: "wednesday",
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

  const groupedEmails: GroupedEmails = {
    today: emails.filter((email) => email.type === "today"),
    yesterday: emails.filter((email) => email.type === "yesterday"),
    wednesday: emails.filter((email) => email.type === "wednesday"),
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
        group flex flex-wrap items-center gap-2 cursor-pointer
        border-b border-[#ADB5BD] px-4 py-3
        hover:bg-[#EDF1FF]
        ${isSelected ? "bg-blue-50" : ""}
        ${isOpened ? "bg-blue-100" : ""}
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
              className={`h-4 w-4 fill-current ${
                email.starred ? "text-yellow-400" : "text-[#E9E9E9]"
              }`}
            />
          </div>
        )}

        {/* Avatar */}
        <div
          className={`
          mr-3 flex h-10 w-10 items-center justify-center
          rounded-full text-sm font-medium text-white ${email.avatarBg}
        `}
        >
          {email.avatar}
        </div>

        {/* Sender & Preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium text-gray-900">
              {email.sender}
            </span>

            {/* Subject */}
            <span
              className={`${
                openedEmail ? "hidden" : "max-lg:hidden"
              } text-sm font-medium text-[#0056B0]`}
            >
              {email.subject}
            </span>

            {!openedEmail && (
              <>
                <div className="max-[1440px]:hidden flex flex-col gap-2">
                  <span
                    className={`
                    max-xl:hidden block whitespace-normal break-words
                    text-sm text-[#545454]
                  `}
                  >
                    {email.preview}
                  </span>

                  {/* Attachments */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {email.attachments
                        .slice(0, 2)
                        .map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1"
                          >
                            <div
                              className={`flex h-3 w-3 items-center justify-center rounded ${
                                index === 0 ? "bg-green-100" : "bg-red-100"
                              }`}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  index === 0 ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                            </div>
                            <span className="truncate text-xs text-gray-600">
                              {attachment}
                            </span>
                          </div>
                        ))}

                      {/* Indicator untuk attachment tambahan */}
                      {email.attachments.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{email.attachments.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Time */}
                <span className="max-sm:hidden ml-2 flex-shrink-0 text-[10px] sm:text-xs text-gray-500">
                  {email.time}
                </span>
                <span className="sm:hidden ml-2 flex-shrink-0 text-[10px] sm:text-xs text-gray-500">
                  {email.shortTime}
                </span>
              </>
            )}
          </div>

          {/* Subject (mobile) */}
          <span
            className={`${
              !openedEmail ? "lg:hidden" : ""
            } text-sm font-medium text-[#0056B0]`}
          >
            {email.subject}
          </span>

          {/* Preview */}
          <span
            className={`
            block text-sm text-[#545454]
            ${
              openedEmail
                ? "whitespace-normal break-words"
                : "truncate min-[1440px]:hidden"
            }
          `}
          >
            {email.preview}
          </span>

          {/* Attachments (opened or responsive) */}
          {email.attachments && email.attachments.length > 0 && (
            <div
              className={`
              flex items-center space-x-2
              ${openedEmail ? "flex" : "min-[1440px]:hidden"}
            `}
            >
              {email.attachments.slice(0, 2).map((attachment, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div
                    className={`flex h-3 w-3 items-center justify-center rounded ${
                      index === 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                  <span className="truncate text-xs text-gray-600">
                    {attachment}
                  </span>
                </div>
              ))}

              {email.attachments.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{email.attachments.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Unread Indicator & Actions */}
        {!openedEmail && (
          <div className="ml-auto flex items-center space-x-2">
            {email.unread && (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
            <Trash2 className="h-4 w-4 cursor-pointer text-gray-400 transition-opacity hover:text-gray-600 opacity-0 group-hover:opacity-100" />
          </div>
        )}
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
    <div className="lg:ml-72 bg-[#F6F9FF] p-4">
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-6">
        {/* Inbox Panel */}
        <div
          className={`${
            openedEmail ? "xl:w-2/6" : "w-full"
          } transition-all duration-300`}
        >
          <div
            className={`${
              openedEmail ? "px-[15px] py-[25px]" : "px-[43px] py-[25px]"
            } flex flex-col bg-white rounded-xl shadow-md`}
          >
            {/* Header */}
            <div className="">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="plus-jakarta-sans text-[32px] font-semibold text-[#353739]">
                    Inbox
                  </h1>
                  <p className="plus-jakarta-sans text-sm text-[#7F7F7F]">
                    2445 messages, 2 Unread
                  </p>
                </div>

                {!openedEmail && (
                  <div className="max-md:hidden flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="plus-jakarta-sans text-sm font-semibold text-[#232323]">
                        From
                      </span>
                      <div className="flex items-center space-x-1 px-3 py-1 border border-[#EBEBEB] rounded-2xl">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Jul, 18 2024</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="plus-jakarta-sans text-sm font-semibold text-[#232323]">
                        To
                      </span>
                      <div className="flex items-center space-x-1 px-3 py-1 border border-[#EBEBEB] rounded-2xl">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Jul, 18 2024</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 py-[25px]">
              <div className="flex items-center justify-between">
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
            <div className="flex-1 overflow-auto py-5">
              {/* Today Section */}
              <div className="mb-6">
                <SectionHeader title="Today" count="3" />
                {groupedEmails.today.map((email: Email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.id)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                  />
                ))}
              </div>

              {/* Yesterday Section */}
              <div className="mb-6">
                <SectionHeader title="Yesterday" count="10" />
                {groupedEmails.yesterday.map((email: Email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.id)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                  />
                ))}
              </div>

              {/* Wednesday Section */}
              <div className="mb-6">
                <SectionHeader title="Wednesday" count="5" />
                {groupedEmails.wednesday.map((email: Email) => (
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
        </div>

        {/* Email Detail Panel */}
        {openedEmail && (
          <EmailDetail
            email={openedEmail}
            handleCloseDetail={handleCloseDetail}
          />
        )}
      </div>
    </div>
  );
}
