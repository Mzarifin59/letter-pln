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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

import { EmailDetail } from "@/components/detail-email";
import { EmailData } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { EmailRow } from "@/components/email-row";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteEmail } from "@/lib/emailRequest";

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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<EmailData | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  let emailListFiltered: EmailData[];

  if (user?.role?.name === "Admin") {
    emailListFiltered = emailList.filter((item) => {
      const hasAdminGudangStatus = item.email_statuses.some(
        (status) => status.user.name === user.name && status.isDelete == false
      );

      return (
        hasAdminGudangStatus &&
        ((item.recipient.name === user.name &&
          item.surat_jalan.status_entry !== "Draft") ||
          item.isHaveStatus === true)
      );
    });
  } else if (user?.role?.name === "Spv") {
    emailListFiltered = emailList.filter((item) => {
      const hasAdminGudangStatus = item.email_statuses.some(
        (status) => status.user.name === user.name && status.isDelete == false
      );

      return (
        hasAdminGudangStatus &&
        (item.surat_jalan.status_entry !== "Draft" ||
          item.isHaveStatus === true)
      );
    });
  } else {
    emailListFiltered = emailList.filter((item) => {
      const hasAdminGudangStatus = item.email_statuses.some(
        (status) => status.user.name === user?.name && status.isDelete == false
      );

      return (
        hasAdminGudangStatus &&
        (item.surat_jalan.status_entry !== "Draft" ||
          item.isHaveStatus === true)
      );
    });
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (isMultipleDelete) {
        const deletePromises = selectedEmails.map(async (emailDocId) => {
          const emailToDelete = emailList.find(
            (e) => e.documentId === emailDocId
          );

          if (!emailToDelete) {
            console.warn(`Email ${emailDocId} tidak ditemukan`);
            return;
          }

          // Cari email_status untuk user ini
          const userEmailStatus = emailToDelete.email_statuses?.find(
            (item) =>
              item.user?.name === user?.name || item.user?.email === user?.email
          );

          if (!userEmailStatus) {
            console.warn(
              `Email status tidak ditemukan untuk user ${user?.name}`
            );
            return;
          }

          const emailStatusId =
            userEmailStatus.documentId || userEmailStatus.id;

          const res = await deleteEmail({ apiUrl, emailStatusId, token });

          if (!res.ok) {
            throw new Error(`Gagal hapus email status ${emailStatusId}`);
          }
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
        if (!selectedToDelete) {
          console.error("selectedToDelete is null!");
          toast.error("Tidak ada email yang dipilih");
          return;
        }

        console.log("selectedToDelete:", selectedToDelete);
        console.log("email_statuses:", selectedToDelete.email_statuses);

        // Validasi email_statuses
        if (
          !selectedToDelete.email_statuses ||
          selectedToDelete.email_statuses.length === 0
        ) {
          toast.error("Data email status tidak ditemukan");
          return;
        }

        // Cari email status milik user yang login
        const userEmailStatus = selectedToDelete.email_statuses.find(
          (item) =>
            item.user?.name === user?.name || item.user?.email === user?.email
        );

        console.log("userEmailStatus found:", userEmailStatus);

        if (!userEmailStatus) {
          toast.error("Anda tidak memiliki akses untuk menghapus email ini");
          return;
        }

        const emailStatusId = userEmailStatus.documentId || userEmailStatus.id;

        const res = await deleteEmail({ apiUrl, emailStatusId, token });

        if (!res.ok) throw new Error("Gagal menghapus email");

        // Update list
        setEmailList((prev) =>
          prev.filter((item) => item.documentId !== selectedToDelete.documentId)
        );

        toast.success("Email berhasil dihapus", {
          description: selectedToDelete.surat_jalan?.perihal,
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

  const handleDeleteClick = (email: EmailData) => {
    setSelectedToDelete(email);
    setShowDeleteDialog(true); 
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;

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

  const handleSort = (order: "asc" | "desc") => {
    const sortedData = [...emailList].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEmailList(sortedData);
  };

  return (
    <>
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

                    {/* Popover untuk sorting */}
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

                  {/* Pagination */}
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
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      className={
                        currentPage === totalPages
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
              <div className="flex-1 overflow-auto py-4">
                {emailListFiltered.length > 0 ? (
                  emailListFiltered
                    .slice(startIndex, endIndex)
                    .map((email) => (
                      <EmailRow
                        key={email.id}
                        email={email}
                        isSelected={selectedEmails.includes(email.documentId)}
                        onSelect={handleSelectEmail}
                        onClick={handleEmailClick}
                        openedEmail={openedEmail}
                        markEmailAsBookmarked={markEmailAsBookmarked}
                        pageRow="Reject"
                        onDelete={handleDeleteClick}
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
