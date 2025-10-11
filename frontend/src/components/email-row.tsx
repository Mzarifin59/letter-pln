"use client";

import { JSX } from "react";
import { EmailData } from "@/lib/interface";
import { Star, Trash2 } from "lucide-react";
import { getUserLogin } from "@/lib/user";

interface EmailRow {
  isSelected: boolean;
  onSelect: (emailId: string) => void;
  onClick?: (email: EmailData) => void;
  email: EmailData;
  openedEmail: EmailData | null;
  markEmailAsBookmarked?: (id: string) => void;
  pageRow?: "Reject" | "Send" | "Draft";
}

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

export const EmailRowInbox = ({
  email,
  isSelected,
  onSelect,
  onClick,
  openedEmail,
}: EmailRow): JSX.Element => {
  const isOpened = openedEmail?.id === email.id;
  const { user } = getUserLogin();

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
              email.email_statuses.find((item) => item.user.name === user?.name)
                ?.is_bookmarked
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
        {getCompanyAbbreviation(email.surat_jalan.penerima.perusahaan_penerima)}
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

export const EmailRow = ({
  email,
  isSelected,
  onSelect,
  onClick,
  openedEmail,
  markEmailAsBookmarked,
  pageRow,
}: EmailRow) => {
  const isOpened = openedEmail?.documentId === email.documentId;
  const { user } = getUserLogin();

  return (
    <div
      className={`
                  px-4 py-3 border-b border-[#ADB5BD] cursor-pointer group
                  hover:bg-[#EDF1FF]
                  ${isSelected ? "bg-blue-50" : ""}
                  ${isOpened ? "bg-blue-100" : ""}
                  flex flex-wrap items-center gap-2
                `}
      onClick={() => onClick?.(email)}
    >
      {/* Checkbox & Star - hidden in mobile when detail open */}
      {!openedEmail && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(email.documentId);
            }}
            className="rounded border-gray-300"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              markEmailAsBookmarked?.(email.documentId);
            }}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Toggle bookmark"
          >
            <Star
              className={`w-4 h-4 transition-colors duration-200 ${
                email.email_statuses.find(
                  (item) => item.user.name === user?.name
                )?.is_bookmarked
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-[#E9E9E9]"
              }`}
            />
          </button>
        </div>
      )}

      {/* Status */}
      {!openedEmail && (
        <div
          className={`${
            pageRow === "Reject" && "Draft" ? "text-[#A62344]" : "text-gray-900"
          } text-xs sm:text-sm font-semibold`}
        >
          {pageRow === "Reject"
            ? "Dibatalkan"
            : pageRow === "Send"
            ? "Kepada :"
            : "Draft"}
        </div>
      )}

      {/* Sender & Preview */}
      <div className="flex-1 min-w-0">
        {openedEmail && (
          <div
            className={`${
              pageRow === "Reject" && "Draft"
                ? "text-[#A62344]"
                : "text-gray-900"
            } text-xs sm:text-sm font-semibold`}
          >
            {pageRow === "Reject"
              ? "Dibatalkan"
              : pageRow === "Send"
              ? "Kepada :"
              : "Draft"}
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 truncate">
            {email.surat_jalan.penerima.perusahaan_penerima}
          </span>
          {!openedEmail && (
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
          )}
        </div>
        <span
          className={` text-sm text-[#545454] block ${
            openedEmail ? "whitespace-normal break-words" : "truncate xl:hidden"
          }`}
        >
          {email.surat_jalan.perihal}
        </span>
      </div>

      {/* Unread Indicator & Actions */}
      {!openedEmail && (
        <div className="flex items-center space-x-2 ml-auto">
          {!email.email_statuses.find((item) => item.user.name === user?.name)
            ?.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          <Trash2
            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
