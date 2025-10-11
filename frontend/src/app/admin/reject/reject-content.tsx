"use client";

import { useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { EmailDetail } from "@/components/detail-email";
import { EmailData } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { EmailRow } from "@/components/email-row";

interface RejectContentProps {
  data: EmailData[];
  token: string | undefined;
}

export default function RejectPageContent({ data, token }: RejectContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [openedEmail, setOpenedEmail] = useState<EmailData | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [emailList, setEmailList] = useState<EmailData[]>(data);
  const { user } = useUserLogin();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  const currentEmail = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    document
      .getElementById("reject-section")
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
      setSelectedEmails(emailList.map((email) => email.documentId));
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

  const markEmailAsRead = async (emailDocumentId: string): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${emailDocumentId}/mark-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark email as read");
      }

      setEmailList((prevEmails) =>
        prevEmails.map((email) => {
          if (email.documentId === emailDocumentId) {
            return {
              ...email,
              email_statuses: email.email_statuses.map((status) => {
                if (status.user.name === user?.name) {
                  return {
                    ...status,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  };
                }
                return status;
              }),
            };
          }
          return email;
        })
      );
    } catch (error) {
      console.error("Error marking email as read:", error);
    }
  };

  const markEmailAsBookmarked = async (
    emailDocumentId: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${emailDocumentId}/mark-bookmarked`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark email as bookmarked");
      }

      // Update state lokal
      setEmailList((prevEmails) =>
        prevEmails.map((email) => {
          if (email.documentId === emailDocumentId) {
            return {
              ...email,
              email_statuses: email.email_statuses.map((status) => {
                if (status.user.name === user?.name) {
                  return {
                    ...status,
                    is_bookmarked: !status.is_bookmarked,
                  };
                }
                return status;
              }),
            };
          }
          return email;
        })
      );
    } catch (error) {
      console.error("Error marking email as bookmarked:", error);
    }
  };

  const handleEmailClick = async (email: EmailData): Promise<void> => {
    setOpenedEmail(email);

    const emailStatus = email.email_statuses.find(
      (item) => item.user.name === user?.name
    );

    if (!emailStatus?.is_read) {
      await markEmailAsRead(email.documentId);
    }
  };

  const handleCloseDetail = (): void => {
    setOpenedEmail(null);
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
                  <button
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePrevious();
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
            <div className="flex-1 overflow-auto py-4">
              {currentEmail.length > 0 ? (
                currentEmail.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedEmails.includes(email.documentId)}
                    onSelect={handleSelectEmail}
                    onClick={handleEmailClick}
                    openedEmail={openedEmail}
                    markEmailAsBookmarked={markEmailAsBookmarked}
                    pageRow="Reject"
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">
                    Tidak ada email rejected
                  </p>
                  <p className="text-sm mt-2">
                    Email rejected anda akan muncul di sini
                  </p>
                </div>
              )}
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
