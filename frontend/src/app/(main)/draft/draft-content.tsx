"use client";

import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MoreHorizontal,
  Star,
  Trash2,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmailData } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";

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
  token: string | undefined;
}

interface EmailRowProps {
  isSelected: boolean;
  onSelect: (emailId: string) => void;
  onRowClick: (email: EmailData) => void;
  email: EmailData;
}

export default function DraftPageContent({ data, token }: DraftContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const { user } = useUserLogin();
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<EmailData | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

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

        toast.success(`${selectedEmails.length} draft berhasil dihapus`, {
          position: "top-center",
        });

        // Reset selection
        setSelectedEmails([]);
        setSelectAll(false);
      } else {
        // 🧍‍♂️ Single delete mode
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

        toast.success("Draft berhasil dihapus", {
          description: selectedToDelete.surat_jalan.perihal,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus draft", { position: "top-center" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedToDelete(null);
      setIsMultipleDelete(false);
    }
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

  const handleRowClick = (email: EmailData): void => {
    sessionStorage.setItem("draftData", JSON.stringify(email));
    router.push(`/create-letter?mode=edit&id=${email.documentId}`);
  };

  const sortedInitialData = [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [emailList, setEmailList] = useState<EmailData[]>(sortedInitialData);
  let emailListFiltered: EmailData[];

  if (user?.role?.name === "Admin") {
    emailListFiltered = emailList.filter((item) => {
      const hasAdminGudangStatus = item.email_statuses.some(
        (status) => status.user.name === "Admin Gudang"
      );

      return hasAdminGudangStatus && item.recipient.name === "Spv";
    });
  } else {
    emailListFiltered = emailList.filter((item) => {
      const hasVendorStatus = item.email_statuses.some(
        (status) => status.user.name === "Vendor"
      );

      return hasVendorStatus && item.surat_jalan.status_surat === "Surat Bongkaran";
    });
  }

  const handleSort = (order: "asc" | "desc") => {
    const sortedData = [...emailList].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEmailList(sortedData);
    setCurrentPage(1);
  };

  const EmailRow = ({
    email,
    isSelected,
    onSelect,
    onRowClick,
  }: EmailRowProps): JSX.Element => {
    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    return (
      <div
        onClick={() => onRowClick(email)}
        className={`
            px-4 py-3 border-b border-[#ADB5BD] cursor-pointer group
            hover:bg-[#EDF1FF] transition-colors
            ${isSelected ? "bg-blue-50" : ""}
            flex flex-wrap items-center gap-2
          `}
      >
        {/* Checkbox & Star - hidden in mobile when detail open */}
        <div className="flex items-center gap-2" onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(email.documentId)}
            className="rounded border-gray-300"
          />
          <Star
            className={`w-4 h-4 fill-current ${
              email.email_statuses.find((item) => item.user.name === user?.name)
                ?.is_bookmarked
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
                className={`max-xl:hidden text-sm text-[#545454] block whitespace-normal break-words`}
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
            className={`text-sm text-[#545454] block whitespace-normal break-words truncate xl:hidden`}
          >
            {email.surat_jalan.perihal}
          </span>
        </div>

        {/* Unread Indicator & Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedToDelete(email);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
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
          <div className="flex-1 overflow-auto px-[43px] py-[25px]">
            {/* Today Section */}
            <div className="mb-6">
              {emailListFiltered.length > 0 ? (
                emailListFiltered
                  .slice(startIndex, endIndex)
                  .map((email: EmailData) => (
                    <EmailRow
                      key={email.id}
                      email={email}
                      isSelected={selectedEmails.includes(email.documentId)}
                      onSelect={handleSelectEmail}
                      onRowClick={handleRowClick}
                    />
                  ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">Tidak ada draft</p>
                  <p className="text-sm mt-2">Draft Anda akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
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
