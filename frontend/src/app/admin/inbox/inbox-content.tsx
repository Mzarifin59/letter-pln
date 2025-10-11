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
                  <EmailRowInbox
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                    openedEmail={openedEmail}
                  />
                ))}
              </div>

              {/* Yesterday Section */}
              <div className="mb-6">
                <SectionHeader title="Yesterday" count={groupedEmails.yesterday.length} />
                {groupedEmails.yesterday.map((email) => (
                  <EmailRowInbox
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                    openedEmail={openedEmail}
                  />
                ))}
              </div>

              {/* Wednesday Section */}
              <div className="mb-6">
                <SectionHeader title="Older" count={groupedEmails.older.length} />
                {groupedEmails.older.map((email) => (
                  <EmailRowInbox
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                    openedEmail={openedEmail} 
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
