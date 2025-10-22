"use client";

import { JSX, useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Calendar,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { EmailDetail } from "@/components/detail-email";
import { EmailRowInbox } from "@/components/email-row";
import { EmailData } from "@/lib/interface";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserLogin } from "@/lib/user";

interface InboxContentProps {
  data: EmailData[];
  token?: string;
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
      const emailDate = new Date(email.surat_jalan.tanggal);
      return emailDate >= today;
    }),
    yesterday: emails.filter((email) => {
      const emailDate = new Date(email.surat_jalan.tanggal);
      return emailDate >= yesterday && emailDate < today;
    }),
    older: emails.filter((email) => {
      const emailDate = new Date(email.surat_jalan.tanggal);
      return emailDate < yesterday;
    }),
  };
};

export default function InboxContentPage({ data, token }: InboxContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [openedEmail, setOpenedEmail] = useState<EmailData | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<EmailData | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const { user } = useUserLogin();

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (isMultipleDelete) {
        // 🧹 Multiple delete mode
        const deletePromises = selectedEmails.map(async (docId) => {
          const res = await fetch(`${apiUrl}/api/emails/${docId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error(`Gagal hapus email ${docId}`);
        });

        await Promise.all(deletePromises);

        // Update list
        setEmailList((prev) =>
          prev.filter((item) => !selectedEmails.includes(item.documentId))
        );

        toast.success(`${selectedEmails.length} Email berhasil dihapus`, {
          position: "top-center",
        });

        setSelectedEmails([]);
        setSelectAll(false);
      } else {
        if (!selectedToDelete) return;

        const res = await fetch(
          `${apiUrl}/api/emails/${selectedToDelete.documentId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Gagal menghapus email");

        setEmailList((prev) =>
          prev.filter((item) => item.documentId !== selectedToDelete.documentId)
        );

        toast.success("Email berhasil dihapus", {
          description: selectedToDelete.surat_jalan.perihal,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus email", { position: "top-center" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedToDelete(null);
      setIsMultipleDelete(false);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const sortedInitialData = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        new Date(b.surat_jalan.tanggal).getTime() -
        new Date(a.surat_jalan.tanggal).getTime()
    );
  }, [data]);

  const [emailList, setEmailList] = useState<EmailData[]>(sortedInitialData);

  const itemPerPage = 15;
  const totalPages = Math.ceil(emailList.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  let currentPageEmails;

  if (user?.role?.name === "Admin") {
    currentPageEmails = emailList
      .filter(
        (item) =>
          item.recipient.name === "Admin" &&
          item.surat_jalan.status_entry !== "Draft"
      )
      .slice(startIndex, endIndex);
  } else {
    currentPageEmails = emailList
      .filter(
        (item) =>
          item.recipient.name === "Spv" &&
          item.surat_jalan.status_entry !== "Draft"
      )
      .slice(startIndex, endIndex);
  }

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
      setSelectedEmails(currentPageEmails.map((email) => email.documentId));
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

  const handleSort = (order: "asc" | "desc") => {
    const sortedData = [...emailList].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEmailList(sortedData);
    setCurrentPage(1);
  };

  // Auto filter ketika fromDate atau toDate berubah
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      const filtered = sortedInitialData.filter((email) => {
        const emailDate = new Date(email.surat_jalan.tanggal);
        return emailDate >= start && emailDate <= end;
      });

      if (filtered.length === 0) {
        toast.info("Tidak ada email dalam rentang tanggal tersebut", {
          position: "top-center",
        });
      }

      setEmailList(filtered);
      setCurrentPage(1);
      setIsFiltered(true);
    } else if (!fromDate && !toDate) {
      setEmailList(sortedInitialData);
      setCurrentPage(1);
      setIsFiltered(false);
    }
  }, [fromDate, toDate, sortedInitialData]);

  const groupedEmailsCurrent: GroupedEmails =
    groupEmailsByDate(currentPageEmails);
  const groupedEmailsAll: GroupedEmails = groupEmailsByDate(emailList);

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
    <>
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
                      {user?.role?.name === "Admin"
                        ? emailList.length
                        : emailList.filter(
                            (item) => item.surat_jalan.status_entry !== "Draft"
                          ).length}{" "}
                      messages, 0 Unread
                    </p>
                  </div>

                  {!openedEmail && (
                    <div className="max-md:hidden flex items-center space-x-4">
                      {/* From Date */}
                      <div className="flex items-center space-x-2">
                        <span className="plus-jakarta-sans text-sm font-semibold text-[#232323]">
                          From
                        </span>
                        <div className="flex items-center space-x-1 px-3 py-1 border border-[#EBEBEB] rounded-2xl">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="text-sm outline-none border-none bg-transparent"
                          />
                        </div>
                      </div>

                      {/* To Date */}
                      <div className="flex items-center space-x-2">
                        <span className="plus-jakarta-sans text-sm font-semibold text-[#232323]">
                          To
                        </span>
                        <div className="flex items-center space-x-1 px-3 py-1 border border-[#EBEBEB] rounded-2xl">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="text-sm outline-none border-none bg-transparent"
                          />
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-40 p-2">
                        <div className="flex flex-col text-sm text-gray-700">
                          <button
                            onClick={() => handleSort("desc")}
                            className="text-left px-2 py-1 rounded-md hover:bg-gray-100"
                          >
                            Terbaru
                          </button>
                          <button
                            onClick={() => handleSort("asc")}
                            className="text-left px-2 py-1 rounded-md hover:bg-gray-100"
                          >
                            Terlama
                          </button>

                          {/* 🔥 New: Hapus Email Terpilih */}
                          {selectedEmails.length > 0 && (
                            <>
                              <div className="border-t my-2" />
                              <button
                                onClick={() => {
                                  setIsMultipleDelete(true);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-left px-2 py-1 text-red-600 rounded-md hover:bg-red-50"
                              >
                                Hapus Email Terpilih ({selectedEmails.length})
                              </button>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                {/* Jika filtered, tampilkan langsung tanpa grouping */}
                {isFiltered ? (
                  <>
                    {currentPageEmails.length > 0 ? (
                      currentPageEmails.map((email) => (
                        <EmailRowInbox
                          key={email.id}
                          email={email}
                          isSelected={selectedEmails.includes(email.documentId)}
                          onSelect={handleSelectEmail}
                          onClick={handleEmailClick}
                          markEmailAsBookmarked={markEmailAsBookmarked}
                          openedEmail={openedEmail}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400">
                        Tidak ada email yang ditemukan
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Tampilkan dengan grouping jika tidak filtered */}
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
                            isSelected={selectedEmails.includes(
                              email.documentId
                            )}
                            markEmailAsBookmarked={markEmailAsBookmarked}
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
                            isSelected={selectedEmails.includes(
                              email.documentId
                            )}
                            markEmailAsBookmarked={markEmailAsBookmarked}
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
                            isSelected={selectedEmails.includes(
                              email.documentId
                            )}
                            markEmailAsBookmarked={markEmailAsBookmarked}
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
                  </>
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
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isMultipleDelete
                ? "Hapus Beberapa Draft Email"
                : "Hapus Draft Email"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {isMultipleDelete ? (
              <>
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-semibold">{selectedEmails.length}</span>{" "}
                draft email terpilih?
              </>
            ) : (
              <>
                Apakah Anda yakin ingin menghapus draft email ini?
                <br />
                <span className="font-semibold">
                  {selectedToDelete?.surat_jalan.perihal || "Tanpa perihal"}
                </span>
              </>
            )}
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
