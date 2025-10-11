"use client";

import { JSX, useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Calendar,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { EmailDetail } from "@/components/detail-email";
import { EmailRowInbox } from "@/components/email-row";
import { EmailData } from "@/lib/interface";

interface InboxContentProps {
  data: EmailData[];
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    document
      .getElementById("draft-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

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

  const groupedEmailsCurrent: GroupedEmails = groupEmailsByDate(currentData);
  const groupedEmailsAll: GroupedEmails = groupEmailsByDate(data);

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
                    {data.length} messages, 0 Unread
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
                  <button
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handlePrevious();
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {totalPages > 0 ? currentPage : "0"} of {totalPages}
                  </span>
                  <button
                    className={
                      currentPage === totalPages || totalPages === 0
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handleNext();
                    }}
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full" />
                  </button>
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-auto py-5">
              {groupedEmailsAll.today.length > 0 && (
                <div className="mb-6">
                  <SectionHeader
                    title="Today"
                    count={groupedEmailsAll.today.length}
                  />
                  {groupedEmailsCurrent.today.map((email) => (
                    <EmailRowInbox
                      key={email.id}
                      email={email}
                      isSelected={selectedEmails.includes(email.documentId)}
                      onSelect={handleSelectEmail}
                      onClick={handleEmailClick}
                      openedEmail={openedEmail}
                    />
                  ))}
                  {groupedEmailsCurrent.today.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-400 italic">
                      No emails on this page
                    </div>
                  )}
                </div>
              )}

              {/* Yesterday Section - tampilkan jika ada di ALL data */}
              {groupedEmailsAll.yesterday.length > 0 && (
                <div className="mb-6">
                  <SectionHeader
                    title="Yesterday"
                    count={groupedEmailsAll.yesterday.length}
                  />
                  {groupedEmailsCurrent.yesterday.map((email) => (
                    <EmailRowInbox
                      key={email.id}
                      email={email}
                      isSelected={selectedEmails.includes(email.documentId)}
                      onSelect={handleSelectEmail}
                      onClick={handleEmailClick}
                      openedEmail={openedEmail}
                    />
                  ))}
                  {groupedEmailsCurrent.yesterday.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-400 italic">
                      No emails on this page
                    </div>
                  )}
                </div>
              )}

              {/* Older Section - tampilkan jika ada di ALL data */}
              {groupedEmailsAll.older.length > 0 && (
                <div className="mb-6">
                  <SectionHeader
                    title="Older"
                    count={groupedEmailsAll.older.length}
                  />
                  {groupedEmailsCurrent.older.map((email) => (
                    <EmailRowInbox
                      key={email.id}
                      email={email}
                      isSelected={selectedEmails.includes(email.documentId)}
                      onSelect={handleSelectEmail}
                      onClick={handleEmailClick}
                      openedEmail={openedEmail}
                    />
                  ))}
                  {groupedEmailsCurrent.older.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-400 italic">
                      No emails on this page
                    </div>
                  )}
                </div>
              )}
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
