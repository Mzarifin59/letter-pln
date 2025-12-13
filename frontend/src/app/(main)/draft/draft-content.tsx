"use client";

import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MoreHorizontal,
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
import { DynamicEmailData, getPerihal } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { deleteEmailReal } from "@/lib/emailRequest";
import { EmailRow } from "@/components/email-row";

interface DraftContentProps {
  data: DynamicEmailData[];
  token: string | undefined;
}

export default function DraftPageContent({ data, token }: DraftContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const { user } = useUserLogin();
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] =
    useState<DynamicEmailData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (isMultipleDelete) {
        // 🧹 Multiple delete mode
        const deletePromises = selectedEmails.map(async (docId) => {
          const resEmail = await (
            await deleteEmailReal({ apiUrl, emailStatusId: docId, token })
          ).resEmail;
          const resEmailStatus = await (
            await deleteEmailReal({ apiUrl, emailStatusId: docId, token })
          ).resStatusEmail;
          if (!resEmail.ok && !resEmailStatus.ok)
            throw new Error(`Gagal hapus email ${docId}`);
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

        const resEmail = await (
          await deleteEmailReal({
            apiUrl,
            emailStatusId: selectedToDelete.documentId,
            token,
          })
        ).resEmail;
        const resEmailStatus = await (
          await deleteEmailReal({
            apiUrl,
            emailStatusId: selectedToDelete.documentId,
            token,
          })
        ).resStatusEmail;
        if (!resEmail.ok && !resEmailStatus.ok)
          throw new Error(`Gagal hapus email ${selectedToDelete.documentId}`);

        setEmailList((prev) =>
          prev.filter((item) => item.documentId !== selectedToDelete.documentId)
        );

        toast.success("Draft berhasil dihapus", {
          description: getPerihal(selectedToDelete),
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

  const handleRowClick = (email: DynamicEmailData): void => {
    sessionStorage.setItem("draftData", JSON.stringify(email));
    const kategori = email.surat_jalan.kategori_surat;

    if (user?.role?.name === "Admin") {
      if (kategori === "Berita Acara Pemeriksaan Tim Mutu") {
        router.push(
          `/create-letter/berita-acara-pemeriksaan-tim-mutu?mode=edit&id=${email.surat_jalan.documentId}`
        );
      } else {
        router.push(
          `/create-letter?mode=edit&id=${email.surat_jalan.documentId}`
        );
      }
    } else {
      router.push(
        `/create-letter-bongkaran?mode=edit&id=${email.surat_jalan.documentId}`
      );
    }
  };

  const sortedInitialData = [...data].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const [emailList, setEmailList] =
    useState<DynamicEmailData[]>(sortedInitialData);
  let emailListFiltered: DynamicEmailData[];

  if (user?.role?.name === "Admin") {
    emailListFiltered = emailList.filter((item) => {
      const hasAdminGudangStatus = item.email_statuses.some(
        (status) => status.user.email === user.email
      );

      return (
        hasAdminGudangStatus &&
        item.surat_jalan.kategori_surat !== "Berita Acara Material Bongkaran"
      );
    });
  } else {
    emailListFiltered = emailList.filter((item) => {
      const hasVendorStatus = item.email_statuses.some(
        (status) => status.user.email === user?.email
      );

      return (
        item.surat_jalan.kategori_surat === "Berita Acara Material Bongkaran" &&
        item.surat_jalan.status_entry === "Draft" &&
        hasVendorStatus
      );
    });
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const itemPerPage = 15;
  const totalPages = Math.ceil(emailListFiltered.length / itemPerPage);

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

  const handleSort = (order: "asc" | "desc") => {
    const sortedData = [...emailList].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEmailList(sortedData);
    setCurrentPage(1);
  };

  const handleDeleteEmail = (email: DynamicEmailData) => {
    setSelectedToDelete(email);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className=" bg-[#F6F9FF] p-9">
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
                <Trash2
                  width={20}
                  height={20}
                  onClick={() => {
                    if (selectedEmails.length > 0) {
                      setIsMultipleDelete(true);
                      setShowDeleteDialog(true);
                    }
                  }}
                  className={`${
                    selectedEmails.length > 0
                      ? "text-gray-500 hover:text-red-600 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed opacity-50"
                  }`}
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
                  .map((email: DynamicEmailData) => (
                    <EmailRow
                      key={email.id}
                      email={email}
                      isSelected={selectedEmails.includes(email.documentId)}
                      onSelect={handleSelectEmail}
                      onClick={handleRowClick}
                      openedEmail={null}
                      pageRow="Draft"
                      onDelete={handleDeleteEmail}
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
                  {selectedToDelete
                    ? getPerihal(selectedToDelete)
                    : "Tanpa perihal"}
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
