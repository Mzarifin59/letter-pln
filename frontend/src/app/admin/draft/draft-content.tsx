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


interface DraftContentProps {
  data: EmailData[];
}

interface EmailRowProps {
  isSelected: boolean;
  onSelect: (emailId: string) => void;
  email: EmailData;
}

export default function DraftPageContent({ data }: DraftContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
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

  const EmailRow = ({
    email,
    isSelected,
    onSelect,
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
            onChange={() => onSelect(email.documentId)}
            className="rounded border-gray-300"
          />
          <Star
            className={`w-4 h-4 fill-current ${
              email.email_statuses.filter(item => item.user.name === user?.name)[0].is_bookmarked
                ? "text-yellow-400"
                : "text-[#E9E9E9]"
            }`}
          />
        </div>

        {/* Status */}
        <div className="text-[#A62344] text-xs sm:text-sm font-semibold">
          Draft
        </div>

        {/* Sender & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              {email.surat_jalan.penerima.perusahaan_penerima}
            </span>
            <>
              <span
                className={`max-xl:hidden jtext-sm text-[#545454] block whitespace-normal break-words`}
              >
                {email.surat_jalan.perihal}
              </span>
              <span className="max-sm:hidden text-[10px] sm:text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDate(email.surat_jalan.createdAt, "long")}
              </span>
              <span className="sm:hidden text-[10px] sm:text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDate(email.surat_jalan.createdAt, "short")}
              </span>
            </>
          </div>
          <span
            className={` text-sm text-[#545454] block whitespace-normal break-words truncate xl:hidden`}
          >
            {email.surat_jalan.perihal}
          </span>
        </div>

        {/* Unread Indicator & Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          {email.email_statuses.filter(item => item.user.name === user?.name)[0].is_read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

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
            {data.map((email: EmailData) => (
              <EmailRow
                key={email.id}
                email={email}
                isSelected={selectedEmails.includes(email.documentId)}
                onSelect={handleSelectEmail}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
