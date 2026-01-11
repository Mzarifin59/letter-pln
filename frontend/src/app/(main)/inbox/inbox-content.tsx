"use client";

import { JSX, useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Calendar,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Trash2,
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

import {
  EmailDetail,
  EmailDetailBeritaBongkaran,
} from "@/components/detail-email";
import { EmailDetailBeritaPemeriksaan } from "@/components/detail-email-berita-pemeriksaan";
import { EmailRowInbox } from "@/components/email-row";
import {
  DynamicEmailData,
  EmailDataAdmin,
  EmailDataVendor,
  EmailDataOther,
  isVendorEmailData,
  getPerihal,
  getTanggalSurat,
  BeritaBongkaran,
} from "@/lib/interface";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserLogin } from "@/lib/user";
import { deleteEmail } from "@/lib/emailRequest";

interface InboxContentProps {
  data: DynamicEmailData[];
  token?: string;
}

interface GroupedEmails {
  today: DynamicEmailData[];
  yesterday: DynamicEmailData[];
  older: DynamicEmailData[];
}

interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  sectionEmails: DynamicEmailData[];
  selectedEmails: string[];
  onSelectSection: (emailIds: string[]) => void;
}

// Helper function untuk mendapatkan tanggal dari surat (menggunakan helper dari interface)
const getTanggalSuratLocal = (item: DynamicEmailData) => {
  return getTanggalSurat(item) || item.surat_jalan.createdAt;
};

// Fungsi helper untuk mengelompokkan email berdasarkan tanggal
const groupEmailsByDate = (emails: DynamicEmailData[]): GroupedEmails => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    today: emails.filter((email) => {
      const emailDate = new Date(getTanggalSuratLocal(email));
      return emailDate >= today;
    }),
    yesterday: emails.filter((email) => {
      const emailDate = new Date(getTanggalSuratLocal(email));
      return emailDate >= yesterday && emailDate < today;
    }),
    older: emails.filter((email) => {
      const emailDate = new Date(getTanggalSuratLocal(email));
      return emailDate < yesterday;
    }),
  };
};

export default function InboxContentPage({ data, token }: InboxContentProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [openedEmail, setOpenedEmail] = useState<DynamicEmailData | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] =
    useState<DynamicEmailData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const { user } = useUserLogin();

  // State untuk toggle section
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    yesterday: true,
    older: true,
  });

  function hasMengetahui(
    sj: unknown
  ): sj is { mengetahui: { ttd_mengetahui?: boolean } } {
    return !!sj && typeof sj === "object" && "mengetahui" in (sj as object);
  }

  // Helper function untuk mengecek apakah Berita Acara Material Bongkaran sudah lengkap signature dan approve
  const isBeritaBongkaranComplete = (item: DynamicEmailData): boolean => {
    if (item.surat_jalan.kategori_surat !== "Berita Acara Material Bongkaran") {
      return false;
    }

    // Cek status harus Approve
    if (item.surat_jalan.status_surat !== "Approve") {
      return false;
    }

    // Cek semua signature sudah terisi
    const mengetahuiLengkap =
      hasMengetahui(item.surat_jalan) &&
      Boolean(item.surat_jalan.mengetahui?.ttd_mengetahui) &&
      ("penerima" in item.surat_jalan && item.surat_jalan.penerima
        ? Boolean(item.surat_jalan.penerima.ttd_penerima)
        : false);

    return mengetahuiLengkap;
  };

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
          description: getPerihal(selectedToDelete),
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

  const handleDeleteClick = (email: DynamicEmailData) => {
    setSelectedToDelete(email);
    setShowDeleteDialog(true);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const sortedInitialData = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [data]);

  const [emailList, setEmailList] =
    useState<DynamicEmailData[]>(sortedInitialData);
  let emailListFiltered: DynamicEmailData[];

  if (user?.role?.name === "Admin") {
    emailListFiltered = emailList.filter((item) => {
      const userEmailStatus = item.email_statuses.find(
        (status) => status.user.name === user.name
      );

      // Pastikan email status ada dan tidak di-delete
      if (!userEmailStatus || userEmailStatus.isDelete === true) {
        return false;
      }

      const kategori = item.surat_jalan.kategori_surat;
      const isAllowedKategori =
        kategori === "Surat Jalan" ||
        kategori === "Berita Acara Pemeriksaan Tim Mutu" ||
        isBeritaBongkaranComplete(item);

      return (
        isAllowedKategori &&
        ((item.recipient.name === user.name &&
          item.surat_jalan.status_entry !== "Draft") ||
          item.isHaveStatus === true)
      );
    });
  } else if (user?.role?.name === "Spv") {
    emailListFiltered = emailList.filter((item) => {
      const userEmailStatus = item.email_statuses.find(
        (status) => status.user.name === user.name
      );

      // Pastikan email status ada dan tidak di-delete
      if (!userEmailStatus || userEmailStatus.isDelete === true) {
        return false;
      }

      const kategori = item.surat_jalan.kategori_surat;

      const knowsIfNotSuratJalan = (item: DynamicEmailData) => {
        // Untuk Berita Acara Pemeriksaan Tim Mutu, tidak perlu cek mengetahui
        if (kategori === "Berita Acara Pemeriksaan Tim Mutu") {
          return true;
        }

        if (kategori !== "Surat Jalan") {
          if (!hasMengetahui(item.surat_jalan)) return false;
          return Boolean(item.surat_jalan.mengetahui?.ttd_mengetahui);
        }

        return true;
      };

      const isAllowedKategori =
        kategori === "Surat Jalan" ||
        kategori === "Berita Acara Pemeriksaan Tim Mutu" ||
        kategori === "Berita Acara Material Bongkaran";

      return (
        isAllowedKategori &&
        ((knowsIfNotSuratJalan(item) &&
          item.recipient.name === user.name &&
          item.surat_jalan.status_entry !== "Draft") ||
          item.isHaveStatus === true)
      );
    });
  } else if (user?.role?.name === "Vendor") {
    emailListFiltered = emailList.filter((item) => {
      const userEmailStatus = item.email_statuses.find(
        (status) => status.user.name === user?.name
      );

      // Pastikan email status ada dan tidak di-delete
      if (!userEmailStatus || userEmailStatus.isDelete === true) {
        return false;
      }

      return (
        item.isHaveStatus === true &&
        item.surat_jalan.kategori_surat === "Berita Acara Material Bongkaran" &&
        item.sender.email === user?.email
      );
    });
  } else {
    emailListFiltered = emailList.filter((item) => {
      const userEmailStatus = item.email_statuses.find(
        (status) => status.user.name === user?.name
      );

      // Pastikan email status ada dan tidak di-delete
      if (!userEmailStatus || userEmailStatus.isDelete === true) {
        return false;
      }

      return (
        item.surat_jalan.status_entry !== "Draft" &&
        item.surat_jalan.kategori_surat === "Berita Acara Material Bongkaran" &&
        hasMengetahui(item.surat_jalan) &&
        (item.surat_jalan as BeritaBongkaran).mengetahui
          ?.departemen_mengetahui === user?.name
      );
    });
  }

  const unreadCount = emailListFiltered.filter((email) => {
    if (!email.email_statuses || email.email_statuses.length === 0) {
      return true;
    }

    const userStatus = email.email_statuses.find(
      (status) => status.user.email === user?.email
    );

    return (
      userStatus?.is_read === false &&
      userStatus?.isDelete === false &&
      email.surat_jalan.status_entry !== "Draft"
    );
  }).length;

  const itemPerPage = 15;
  const totalPages = Math.ceil(emailListFiltered.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  let currentPageEmails = emailListFiltered.slice(startIndex, endIndex);

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

  // Handler untuk toggle section
  const handleToggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handler untuk select all dalam section
  const handleSelectSection = (
    emailIds: string[],
    section: keyof typeof expandedSections
  ) => {
    const sectionEmailIds = emailIds;
    const allSelected = sectionEmailIds.every((id) =>
      selectedEmails.includes(id)
    );

    if (allSelected) {
      // Deselect semua email di section ini
      setSelectedEmails((prev) =>
        prev.filter((id) => !sectionEmailIds.includes(id))
      );
    } else {
      // Select semua email di section ini
      setSelectedEmails((prev) => [
        ...prev.filter((id) => !sectionEmailIds.includes(id)),
        ...sectionEmailIds,
      ]);
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

      let emailIdToDispatch: number | null = null;

      setEmailList((prevEmails) => {
        // Find email before updating to get email.id for event
        const updatedEmail = prevEmails.find(
          (email) => email.documentId === emailDocumentId
        );

        if (updatedEmail?.id) {
          emailIdToDispatch = updatedEmail.id;
        }

        return prevEmails.map((email) => {
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
        });
      });

      // Dispatch event setelah render cycle selesai untuk update Header dan Sidebar
      if (emailIdToDispatch) {
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent("emailRead", {
              detail: { emailId: emailIdToDispatch },
            })
          );
        });
      }
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

      // Update openedEmail juga jika sedang dibuka
      if (openedEmail?.documentId === emailDocumentId) {
        setOpenedEmail((prevEmail) => {
          if (!prevEmail) return prevEmail;
          return {
            ...prevEmail,
            email_statuses: prevEmail.email_statuses.map((status) => {
              if (status.user.name === user?.name) {
                return {
                  ...status,
                  is_bookmarked: !status.is_bookmarked,
                };
              }
              return status;
            }),
          };
        });
      }
    } catch (error) {
      console.error("Error marking email as bookmarked:", error);
    }
  };

  const handleEmailClick = async (email: DynamicEmailData): Promise<void> => {
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
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
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
        const emailDate = new Date(getTanggalSuratLocal(email));
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
  const groupedEmailsAll: GroupedEmails = groupEmailsByDate(emailListFiltered);

  const SectionHeader = ({
    title,
    count,
    isExpanded,
    onToggle,
    sectionEmails,
    selectedEmails,
    onSelectSection,
  }: SectionHeaderProps): JSX.Element => {
    const sectionEmailIds = sectionEmails.map((email) => email.documentId);
    const allSelected =
      sectionEmailIds.length > 0 &&
      sectionEmailIds.every((id) => selectedEmails.includes(id));
    const someSelected =
      !allSelected && sectionEmailIds.some((id) => selectedEmails.includes(id));

    return (
      <div className="flex items-center px-4 py-2 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) {
              input.indeterminate = someSelected;
            }
          }}
          onChange={() => onSelectSection(sectionEmailIds)}
          className="mr-3 rounded border-gray-300 cursor-pointer"
        />
        <ChevronDown
          onClick={onToggle}
          className={`w-4 h-4 text-gray-500 mr-2 transition-transform cursor-pointer ${
            !isExpanded ? "-rotate-90" : ""
          }`}
        />
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-sm text-gray-500 ml-2">{count}</span>
      </div>
    );
  };

  const renderEmailDetail = () => {
    if (!openedEmail) return null;

    const kategoriSurat = openedEmail.surat_jalan.kategori_surat;
    const userRole = user?.role?.name;

    if (userRole === "Admin") {
      // Admin bisa melihat Surat Jalan, Berita Pemeriksaan, dan Berita Acara Material Bongkaran (jika lengkap dan approve)
      if (kategoriSurat === "Berita Acara Pemeriksaan Tim Mutu") {
        return (
          <EmailDetailBeritaPemeriksaan
            email={openedEmail as EmailDataOther}
            handleCloseDetail={handleCloseDetail}
            isSend={true}
            markEmailAsBookmarked={markEmailAsBookmarked}
          />
        );
      }
      if (kategoriSurat === "Berita Acara Material Bongkaran") {
        return (
          <EmailDetailBeritaBongkaran
            email={openedEmail as EmailDataVendor}
            handleCloseDetail={handleCloseDetail}
            isSend={true}
            markEmailAsBookmarked={markEmailAsBookmarked}
          />
        );
      }
      return (
        <EmailDetail
          email={openedEmail}
          handleCloseDetail={handleCloseDetail}
          isSend={true}
          markEmailAsBookmarked={markEmailAsBookmarked}
        />
      );
    }

    if (userRole === "Vendor" || userRole === "Gardu Induk") {
      return (
        <EmailDetailBeritaBongkaran
          email={openedEmail as EmailDataVendor}
          handleCloseDetail={handleCloseDetail}
          isSend={true}
          markEmailAsBookmarked={markEmailAsBookmarked}
        />
      );
    }

    if (userRole === "Spv") {
      if (kategoriSurat === "Surat Jalan") {
        return (
          <EmailDetail
            email={openedEmail}
            handleCloseDetail={handleCloseDetail}
            isSend={true}
            markEmailAsBookmarked={markEmailAsBookmarked}
          />
        );
      } else if (kategoriSurat === "Berita Acara Material Bongkaran") {
        return (
          <EmailDetailBeritaBongkaran
            email={openedEmail as EmailDataVendor}
            handleCloseDetail={handleCloseDetail}
            isSend={true}
            markEmailAsBookmarked={markEmailAsBookmarked}
          />
        );
      } else if (kategoriSurat === "Berita Acara Pemeriksaan Tim Mutu") {
        return (
          <EmailDetailBeritaPemeriksaan
            email={openedEmail as EmailDataOther}
            handleCloseDetail={handleCloseDetail}
            isSend={true}
            markEmailAsBookmarked={markEmailAsBookmarked}
          />
        );
      }
    }

    return null;
  };

  return (
    <>
      <div className="bg-[#F6F9FF] p-4 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-6 h-full">
          {/* Inbox Panel */}
          <div
            className={`${
              openedEmail ? "hidden" : "w-full"
            } transition-all duration-300`}
          >
            <div
              className={`${
                openedEmail ? "px-[15px] py-[25px]" : "px-[43px] py-[25px]"
              } flex flex-col bg-white rounded-xl shadow-md h-full overflow-hidden`}
            >
              {/* Header */}
              <div className="">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="plus-jakarta-sans text-[32px] font-semibold text-[#353739]">
                      Inbox
                    </h1>
                    <p className="plus-jakarta-sans text-sm text-[#7F7F7F]">
                      {emailListFiltered.length} messages, {unreadCount} Unread
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
              <div className="flex-1 overflow-y-auto py-5">
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
                          isExpanded={expandedSections.today}
                          onToggle={() => handleToggleSection("today")}
                          sectionEmails={groupedEmailsCurrent.today}
                          selectedEmails={selectedEmails}
                          onSelectSection={(ids) =>
                            handleSelectSection(ids, "today")
                          }
                        />
                        {expandedSections.today && (
                          <>
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
                                Tidak ada email pada halaman ini
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {groupedEmailsAll.yesterday.length > 0 && (
                      <div className="mb-6">
                        <SectionHeader
                          title="Yesterday"
                          count={groupedEmailsAll.yesterday.length}
                          isExpanded={expandedSections.yesterday}
                          onToggle={() => handleToggleSection("yesterday")}
                          sectionEmails={groupedEmailsCurrent.yesterday}
                          selectedEmails={selectedEmails}
                          onSelectSection={(ids) =>
                            handleSelectSection(ids, "yesterday")
                          }
                        />
                        {expandedSections.yesterday && (
                          <>
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
                                Tidak ada email pada halaman ini
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {groupedEmailsAll.older.length > 0 && (
                      <div className="mb-6">
                        <SectionHeader
                          title="Older"
                          count={groupedEmailsAll.older.length}
                          isExpanded={expandedSections.older}
                          onToggle={() => handleToggleSection("older")}
                          sectionEmails={groupedEmailsCurrent.older}
                          selectedEmails={selectedEmails}
                          onSelectSection={(ids) =>
                            handleSelectSection(ids, "older")
                          }
                        />
                        {expandedSections.older && (
                          <>
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
                                Tidak ada email pada halaman ini
                              </div>
                            )}
                          </>
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
            <div className="w-full h-full overflow-hidden">
              {renderEmailDetail()}
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
