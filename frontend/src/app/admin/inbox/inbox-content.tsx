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
import { EmailData } from "@/lib/interface";
import { getUserLogin } from "@/lib/user";

function formatDate(dateString: string, type: "long" | "short" = "long") {
  const date = new Date(dateString);

  if (type === "long") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (type === "short") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  return dateString;
}

function getCompanyAbbreviation(fullName: string, maxLetters = 3): string {
  if (!fullName) return "";

  // Split nama perusahaan jadi kata-kata
  const words = fullName.split(" ").filter((w) => w.length > 0);

  // Ambil huruf pertama tiap kata
  const initials = words.map((w) => w[0].toUpperCase());

  // Ambil maksimal maxLetters huruf
  return initials.slice(0, maxLetters).join("");
}

interface InboxContentProps {
  data: EmailData[];
}

interface EmailRowProps {
  isSelected: boolean;
  onSelect: (emailId: string) => void;
  onClick?: (email: EmailData) => void;
  email: EmailData;
}

interface GroupedEmails {
  today: EmailData[];
  yesterday: EmailData[];
  older: EmailData[];
}

interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded?: boolean;
}


// Fungsi helper untuk mengelompokkan email berdasarkan tanggal
const groupEmailsByDate = (emails: EmailData[]): GroupedEmails => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    today: emails.filter((email) => {
      const emailDate = new Date(email.createdAt);
      return emailDate >= today;
    }),
    yesterday: emails.filter((email) => {
      const emailDate = new Date(email.createdAt);
      return emailDate >= yesterday && emailDate < today;
    }),
    older: emails.filter((email) => {
      const emailDate = new Date(email.createdAt);
      return emailDate < yesterday;
    }),
  };
};

export default function InboxContentPage({ data }: InboxContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [openedEmail, setOpenedEmail] = useState<EmailData | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const { user } = getUserLogin();

  const handleSelectAll = (): void => {
    if (selectAll) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(data.map((email) => email.documentId));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectEmail = (emailId: string): void => {
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter((id) => id !== emailId));
    } else {
      setSelectedEmails([...selectedEmails, emailId]);
    }
  };

  const handleEmailClick = (email: EmailData): void => {
    setOpenedEmail(email);
  };

  const handleCloseDetail = (): void => {
    setOpenedEmail(null);
  };

  const groupedEmails: GroupedEmails = groupEmailsByDate(data);

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
        onClick={() => onClick?.(email)}
      >
        {/* Checkbox & Star - hidden in mobile when detail open */}
        {!openedEmail && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(email.documentId)}
              className="rounded border-gray-300"
            />
            <Star
              className={`h-4 w-4 fill-current ${
                email.email_statuses.find(
                  (item) => item.user.name === user?.name
                )?.is_bookmarked
                  ? "text-yellow-400"
                  : "text-[#E9E9E9]"
              }`}
            />
          </div>
        )}

        {/* Avatar */}
        <div
          className={`
          mr-3 flex h-10 w-10 items-center justify-center
          rounded-full text-sm font-medium text-white bg-blue-500
        `}
        >
          {getCompanyAbbreviation(
            email.surat_jalan.penerima.perusahaan_penerima
          )}
        </div>

        {/* Sender & Preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium text-gray-900">
              {email.surat_jalan.penerima.perusahaan_penerima}
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
                    {email.surat_jalan.perihal}
                  </span>

                  {/* Attachments */}
                  {email.surat_jalan.lampiran &&
                    email.surat_jalan.lampiran.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {email.surat_jalan.lampiran
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
                                {attachment.name}
                              </span>
                            </div>
                          ))}

                        {/* Indicator untuk attachment tambahan */}
                        {email.surat_jalan.lampiran.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{email.surat_jalan.lampiran.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                </div>
                {/* Time */}
                <span className="max-sm:hidden ml-2 flex-shrink-0 text-[10px] sm:text-xs text-gray-500">
                  {formatDate(email.surat_jalan.createdAt, "long")}
                </span>
                <span className="sm:hidden ml-2 flex-shrink-0 text-[10px] sm:text-xs text-gray-500">
                  {formatDate(email.surat_jalan.createdAt, "short")}
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
            {email.surat_jalan.perihal}
          </span>

          {/* Attachments (opened or responsive) */}
          {email.surat_jalan.lampiran &&
            email.surat_jalan.lampiran.length > 0 && (
              <div
                className={`
              flex items-center space-x-2
              ${openedEmail ? "flex" : "min-[1440px]:hidden"}
            `}
              >
                {email.surat_jalan.lampiran
                  .slice(0, 2)
                  .map((attachment, index) => (
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
                        {attachment.name}
                      </span>
                    </div>
                  ))}

                {email.surat_jalan.lampiran.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{email.surat_jalan.lampiran.length - 2} more
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Unread Indicator & Actions */}
        {!openedEmail && (
          <div className="ml-auto flex items-center space-x-2">
            {!email.email_statuses.find((item) => item.user.name === user?.name)
              ?.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
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
                <SectionHeader title="Today" count={groupedEmails.today.length} />
                {groupedEmails.today.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                  />
                ))}
              </div>

              {/* Yesterday Section */}
              <div className="mb-6">
                <SectionHeader title="Yesterday" count={groupedEmails.yesterday.length} />
                {groupedEmails.yesterday.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                  />
                ))}
              </div>

              {/* Wednesday Section */}
              <div className="mb-6">
                <SectionHeader title="Older" count={groupedEmails.older.length} />
                {groupedEmails.older.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
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
