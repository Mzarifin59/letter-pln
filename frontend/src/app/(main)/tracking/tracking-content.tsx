"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUserLogin } from "@/lib/user";

// Types
interface SuratJalan {
  no_surat_jalan: string;
  tanggal: string;
  perihal: string;
  status_surat: string;
  status_entry: string;
  documentId: string;
}

interface Sender {
  name: string;
}

interface Recipient {
  name: string;
}

interface EmailData {
  id: string;
  documentId: string;
  sender: Sender;
  recipient: Recipient;
  surat_jalan: SuratJalan;
}

interface TrackingContentProps {
  data: EmailData[];
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export default function TrackingContentPage({ data }: TrackingContentProps) {
  const dataEmail = data.sort(
    (a, b) =>
      new Date(b.surat_jalan.tanggal).getTime() -
      new Date(a.surat_jalan.tanggal).getTime()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmailData | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserLogin();

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  let currentData;

  if (user?.role?.name === "Admin") {
    currentData = dataEmail.slice(startIndex, endIndex);
  } else if (user?.role?.name === "Spv") {
    currentData = dataEmail
      .filter(
        (item) =>
          item.surat_jalan.status_surat === "In Progress" &&
          item.surat_jalan.status_entry !== "Draft"
      )
      .slice(startIndex, endIndex);
  } else {
    currentData = dataEmail
      .filter(
        (item) =>
          item.surat_jalan.status_surat === "Approve" &&
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

  const handleSeeDetail = (item: EmailData) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    setShowRejectForm(false);
    setRejectMessage("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setShowRejectForm(false);
    setRejectMessage("");
    setSelectedItem(null);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/surat-jalans/${selectedItem.surat_jalan.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              status_surat: "Approve",
            },
          }),
        }
      );

      const responseTwo = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${selectedItem.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              sender: {
                connect: [`${user?.documentId}`],
              },
              recipient: {
                connect: ["rzsqmsg3fgzi0d7wmm4njvtg"],
              },
            },
          }),
        }
      );

      const responseEmail = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${selectedItem.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              isHaveStatus: true,
            },
          }),
        }
      );

      const createStatusEmail = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/email-statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              email : {
                connect : [`${selectedItem.documentId}`]
              },
              user : {
                connect : ['j1z9jwyfbntnn7zkb2lbj3gq']
              }
            },
          }),
        }
      );

      if (!response.ok && !responseTwo.ok && !responseEmail.ok && !createStatusEmail.ok) {
        throw new Error("Gagal mengupdate status surat jalan");
      }

      toast.success("Surat berhasil disetujui", { position: "top-center" });

      handleCloseDialog();

      // Refresh halaman atau update state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan saat memproses permintaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    setShowRejectForm(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectMessage.trim()) {
      toast.error("Pesan penolakan harus diisi", { position: "top-center" });
      return;
    }

    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const suratJalanResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/surat-jalans/${selectedItem.surat_jalan.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              status_surat: "Reject",
            },
          }),
        }
      );

      const responseTwo = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${selectedItem.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              sender: {
                connect: [`${user?.documentId}`],
              },
              recipient: {
                connect: ["rzsqmsg3fgzi0d7wmm4njvtg"],
              },
            },
          }),
        }
      );

      if (!suratJalanResponse.ok && !responseTwo.ok) {
        throw new Error("Gagal mengupdate status surat jalan");
      }

      // Update email dengan pesan
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/emails/${selectedItem.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              pesan: rejectMessage,
              isHaveStatus: true,
            },
          }),
        }
      );

      if (!emailResponse.ok) {
        throw new Error("Gagal mengupdate pesan email");
      }

      toast.success("Surat berhasil ditolak", { position: "top-center" });

      handleCloseDialog();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan saat memproses permintaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSPV = user?.role?.name === "Spv";

  return (
    <>
      <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-9 overflow-hidden">
        <div className="flex flex-col bg-white rounded-xl shadow-md">
          {/* Header */}
          <div className="border-b border-[#7F7F7F4D]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-[43px] py-4 sm:py-[25px] gap-3">
              <h1 className="plus-jakarta-sans text-2xl sm:text-[32px] font-semibold text-[#353739]">
                Tracking
              </h1>
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

          {/* Table */}
          <div className="px-5 sm:px-[43px] py-5 sm:py-[25px]">
            {/* versi desktop */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#ADB5BD]">
              <table className="w-full border-collapse">
                <thead className="bg-[#F6F9FF]">
                  <tr>
                    {[
                      "No",
                      "Tanggal Dibuat",
                      "Dari",
                      "Kepada",
                      "Perihal",
                      isSPV || user?.role?.name === "Vendor" ? "Detail" : "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="plus-jakarta-sans text-left text-sm font-semibold text-[#232323] py-4 px-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={index} className="border-t border-[#ADB5BD]">
                      <td className="py-4 px-6 text-sm text-[#545454]">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#545454]">
                        {formatDateTime(item.surat_jalan.tanggal)}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#545454]">
                        {item.sender.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#545454]">
                        {item.recipient.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#545454]">
                        {item.surat_jalan.perihal}
                      </td>
                      <td className="py-4 px-6">
                        {isSPV || user?.role?.name === "Vendor" ? (
                          <button
                            onClick={() => handleSeeDetail(item)}
                            className="bg-[#4A90E2] hover:bg-[#3a7bc8] text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
                          >
                            See Detail
                          </button>
                        ) : (
                          <>
                            {item.surat_jalan.status_entry !== "Draft" ? (
                              <span
                                className={`${
                                  item.surat_jalan.status_surat === "Approve"
                                    ? "text-[#188580] bg-[#188580]/20"
                                    : item.surat_jalan.status_surat === "Reject"
                                    ? "text-[#A62344] bg-[#A62344]/20"
                                    : "text-[#D3A518] bg-[#D3A518]/20"
                                } plus-jakarta-sans font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                              >
                                {item.surat_jalan.status_surat}
                              </span>
                            ) : (
                              <span className="text-gray-600 bg-gray-100 plus-jakarta-sans font-semibold text-sm px-3 py-1 rounded-2xl inline-block">
                                Draft
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* versi mobile */}
            <div className="space-y-4 md:hidden">
              {currentData.map((row, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#ADB5BD] p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-[#232323]">
                      #{index + 1}
                    </span>
                    {isSPV ? (
                      <button
                        onClick={() => handleSeeDetail(row)}
                        className="bg-[#4A90E2] hover:bg-[#3a7bc8] text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
                      >
                        See Detail
                      </button>
                    ) : (
                      <>
                        {row.surat_jalan.status_entry !== "Draft" ? (
                          <span
                            className={`${
                              row.surat_jalan.status_surat === "Approve"
                                ? "text-[#188580] bg-[#188580]/20"
                                : row.surat_jalan.status_surat === "Reject"
                                ? "text-[#A62344] bg-[#A62344]/20"
                                : "text-[#D3A518] bg-[#D3A518]/20"
                            } plus-jakarta-sans font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                          >
                            {row.surat_jalan.status_surat}
                          </span>
                        ) : (
                          <span className="text-gray-600 bg-gray-100 plus-jakarta-sans font-semibold text-sm px-3 py-1 rounded-2xl inline-block">
                            Draft
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {formatDateTime(row.surat_jalan.tanggal)}
                  </p>
                  <p className="text-sm text-[#545454]">
                    <span className="font-medium">Dari:</span> {row.sender.name}
                  </p>
                  <p className="text-sm text-[#545454]">
                    <span className="font-medium">Kepada:</span>{" "}
                    {row.recipient.name}
                  </p>
                  <p className="text-sm text-[#545454] mt-1">
                    {row.surat_jalan.perihal}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog from shadcn */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#353739]">
              Detail Surat Jalan
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detail informasi surat jalan dan approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* No Surat Jalan */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                No. Surat Jalan
              </label>
              <p className="text-base font-semibold text-[#353739] bg-gray-50 p-3 rounded-lg">
                {selectedItem?.surat_jalan.no_surat_jalan}
              </p>
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Tanggal
              </label>
              <p className="text-base text-[#545454]">
                {selectedItem &&
                  formatDateTime(selectedItem.surat_jalan.tanggal)}
              </p>
            </div>

            {/* Dari */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Dari
              </label>
              <p className="text-base text-[#545454]">
                {selectedItem?.sender.name}
              </p>
            </div>

            {/* Kepada */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Kepada
              </label>
              <p className="text-base text-[#545454]">
                {selectedItem?.recipient.name}
              </p>
            </div>

            {/* Perihal */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Perihal
              </label>
              <p className="text-base text-[#545454]">
                {selectedItem?.surat_jalan.perihal}
              </p>
            </div>

            {/* Reject Form */}
            {showRejectForm && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <label className="text-sm font-medium text-red-900 block mb-2">
                  Alasan Penolakan *
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Masukkan alasan penolakan..."
                  className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4">
            {!showRejectForm ? (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#188580] hover:bg-[#156d69] text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Memproses..." : "Approve"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#A62344] hover:bg-[#8a1d39] text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectMessage("");
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#A62344] hover:bg-[#8a1d39] text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Memproses..." : "Kirim Penolakan"}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
