"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useState, ChangeEvent, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUserLogin } from "@/lib/user";
import {
  DynamicEmailData,
  EmailDataVendor,
  EmailDataAdmin,
} from "@/lib/interface";
import {
  approveBeritaBongkaran,
  approveEmailSurat,
  rejectBeritaBongkaran,
  rejectEmailSurat,
} from "@/lib/emailRequest";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignatureCanvas from "react-signature-canvas";
import {
  SignatureData,
  SignatureType,
} from "@/lib/surat-bongkaran/berita-bongkaran.type";
import { FileUtils } from "@/lib/surat-bongkaran/file.utils";
import { StrapiAPIService } from "@/lib/surat-bongkaran/strapi.service";

interface TrackingContentProps {
  data: DynamicEmailData[];
  token?: string;
}

interface PreviewData {
  upload: string | null;
  signature: string | null;
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

function hasMengetahui(
  sj: unknown
): sj is { mengetahui: { ttd_mengetahui?: boolean } } {
  return !!sj && typeof sj === "object" && "mengetahui" in (sj as object);
}

export default function TrackingContentPage({
  data,
  token,
}: TrackingContentProps) {
  const { user } = useUserLogin();

  // Helper function untuk mendapatkan tanggal dari surat
  const getTanggalSurat = (item: DynamicEmailData) => {
    const kategori = item.surat_jalan.kategori_surat;

    if (kategori === "Berita Acara Material Bongkaran") {
      return (item as EmailDataVendor).surat_jalan.tanggal_kontrak ?? null;
    }

    return (item as EmailDataAdmin).surat_jalan.tanggal ?? null;
  };

  // Helper function untuk mendapatkan nomor surat
  const getNoSurat = (item: DynamicEmailData) => {
    const kategori = item.surat_jalan.kategori_surat;

    if (kategori === "Berita Acara Material Bongkaran") {
      return (item as EmailDataVendor).surat_jalan.no_berita_acara ?? null;
    }
    return (item as EmailDataAdmin).surat_jalan.no_surat_jalan ?? null;
  };

  const [signatureMengetahui, setSignatureMengetahui] = useState<SignatureData>(
    {
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    }
  );
  const [signaturePenerima, setSignaturePenerima] = useState<SignatureData>({
    upload: null,
    signature: null,
    preview: { upload: null, signature: null },
  });
  const previewMengetahui: PreviewData = {
    upload: signatureMengetahui.preview.upload,
    signature: signatureMengetahui.preview.signature,
  };
  const previewPenerima: PreviewData = {
    upload: signaturePenerima.preview.upload,
    signature: signaturePenerima.preview.signature,
  };
  const signatureRefMengetahui = useRef<SignatureCanvas>(null);
  const signatureRefPenerima = useRef<SignatureCanvas>(null);

  const dataEmail = data.sort(
    (a, b) =>
      new Date(getTanggalSurat(b)).getTime() -
      new Date(getTanggalSurat(a)).getTime()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DynamicEmailData | null>(
    null
  );
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  let currentData;

  if (user?.role?.name === "Admin") {
    currentData = dataEmail.slice(startIndex, endIndex);
  } else if (user?.role?.name === "Spv") {
    const canShow = (item: DynamicEmailData) => {
      const kategori = item.surat_jalan.kategori_surat;
      if (kategori === "Surat Jalan") {
        return item.surat_jalan.status_surat === "In Progress";
      }
      const mengetahuiLengkap =
        hasMengetahui(item.surat_jalan) &&
        item.surat_jalan.status_surat !== "Reject" &&
        Boolean(item.surat_jalan.mengetahui?.ttd_mengetahui) &&
        Boolean(!item.surat_jalan.penerima.ttd_penerima);

      return mengetahuiLengkap;
    };

    currentData = dataEmail
      .filter((item) => canShow(item))
      .slice(startIndex, endIndex);
  } else if (user?.role?.name === "Vendor") {
    currentData = dataEmail
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat === "Berita Acara Material Bongkaran"
      )
      .slice(startIndex, endIndex);
  } else {
    currentData = dataEmail
      .filter(
        (item) =>
          item.surat_jalan.status_surat === "In Progress" &&
          item.surat_jalan.status_entry !== "Draft" &&
          item.surat_jalan.kategori_surat === "Berita Acara Material Bongkaran"
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

  const handleSeeDetail = (item: DynamicEmailData) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    setShowRejectForm(false);
    setRejectMessage("");
    // Reset signature state
    setSignatureMengetahui({
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    });
    setSignaturePenerima({
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    });
    if (signatureRefMengetahui.current) {
      signatureRefMengetahui.current.clear();
    }
    if (signatureRefPenerima.current) {
      signatureRefPenerima.current.clear();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setShowRejectForm(false);
    setRejectMessage("");
    setSelectedItem(null);
    // Reset signature state
    setSignatureMengetahui({
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    });
    setSignaturePenerima({
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    });
    if (signatureRefMengetahui.current) {
      signatureRefMengetahui.current.clear();
    }
    if (signatureRefPenerima.current) {
      signatureRefPenerima.current.clear();
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    const kategoriSurat = selectedItem.surat_jalan.kategori_surat;
    const userRole = user?.role?.name;

    // Validasi signature untuk Gardu Induk dan Spv dengan Berita Acara
    if (userRole === "Gardu Induk") {
      if (!signatureMengetahui.upload && !signatureMengetahui.signature) {
        toast.error("Mohon berikan tanda tangan terlebih dahulu", {
          position: "top-center",
        });
        return;
      }
    } else {
      if (!signaturePenerima.upload && !signaturePenerima.signature) {
        toast.error("Mohon berikan tanda tangan terlebih dahulu", {
          position: "top-center",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // ROLE SPV
      if (userRole === "Spv") {
        // Spv dengan Surat Jalan - tanpa signature
        if (kategoriSurat === "Surat Jalan") {
          const response = await approveEmailSurat({
            emailId: selectedItem.documentId,
            apiUrl,
            token,
          });

          if (!response.ok) {
            throw new Error("Gagal mengupdate status surat jalan");
          }

          toast.success("Surat berhasil disetujui", { position: "top-center" });
        }
        // Spv dengan Berita Acara
        else if (kategoriSurat === "Berita Acara Material Bongkaran") {
          // Upload TTD Penerima
          let ttdPenerimaId = null;
          if (signaturePenerima.upload) {
            const uploaded = await StrapiAPIService.uploadFile(
              signaturePenerima.upload,
              `${selectedItem.recipient.name}_ttd.png`
            );
            ttdPenerimaId = uploaded.id;
          } else if (signaturePenerima.signature) {
            const file = await FileUtils.dataURLToFile(
              signaturePenerima.signature,
              `${selectedItem.recipient.name}_ttd.png`
            );
            const uploaded = await StrapiAPIService.uploadFile(file);
            ttdPenerimaId = uploaded.id;
          }

          const response = await approveBeritaBongkaran({
            emailId: selectedItem.documentId,
            apiUrl,
            token,
            signaturePenerima: ttdPenerimaId,
          });

          if (!response.ok) {
            throw new Error("Gagal mengupdate status berita bongkaran");
          }

          toast.success("Berita berhasil disetujui", {
            position: "top-center",
          });
        }
      }
      // ROLE GARDU INDUK
      else if (userRole === "Gardu Induk") {
        // Upload TTD Mengetahui
        let ttdMengetahuiId = null;
        if (signatureMengetahui.upload) {
          const uploaded = await StrapiAPIService.uploadFile(
            signatureMengetahui.upload,
            `${selectedItem.recipient.name}_ttd.png`
          );
          ttdMengetahuiId = uploaded.id;
        } else if (signatureMengetahui.signature) {
          const file = await FileUtils.dataURLToFile(
            signatureMengetahui.signature,
            `${selectedItem.recipient.name}_ttd.png`
          );
          const uploaded = await StrapiAPIService.uploadFile(file);
          ttdMengetahuiId = uploaded.id;
        }

        const response = await approveBeritaBongkaran({
          emailId: selectedItem.documentId,
          apiUrl,
          token,
          signature: ttdMengetahuiId,
        });

        if (!response.ok) {
          throw new Error("Gagal mengupdate status berita bongkaran");
        }

        toast.success("Berita berhasil disetujui", { position: "top-center" });
      }

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const kategoriSurat = selectedItem.surat_jalan.kategori_surat;
      const userRole = user?.role?.name;

      // ===== ROLE SPV =====
      if (userRole === "Spv") {
        // Spv dengan Surat Jalan
        if (kategoriSurat === "Surat Jalan") {
          const response = await rejectEmailSurat({
            emailId: selectedItem.documentId,
            apiUrl,
            token,
            pesan: rejectMessage,
          });

          if (!response.ok) {
            throw new Error("Gagal mengupdate reject email");
          }

          toast.success("Surat berhasil ditolak", { position: "top-center" });
        }
        // Spv dengan Berita Acara atau Surat Bongkaran
        else if (kategoriSurat === "Berita Acara Material Bongkaran") {
          const response = await rejectBeritaBongkaran({
            emailId: selectedItem.documentId,
            apiUrl,
            token,
            pesan: rejectMessage,
          });

          if (!response.ok) {
            throw new Error("Gagal mengupdate reject berita bongkaran");
          }

          toast.success("Berita berhasil ditolak", { position: "top-center" });
        }
      }
      // ===== ROLE GARDU INDUK =====
      else if (userRole === "Gardu Induk") {
        const response = await rejectBeritaBongkaran({
          emailId: selectedItem.documentId,
          apiUrl,
          token,
          pesan: rejectMessage,
        });

        if (!response.ok) {
          throw new Error("Gagal mengupdate reject berita bongkaran");
        }

        toast.success("Berita berhasil ditolak", { position: "top-center" });
      }

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

  // SIGNATURE HANDLERS
  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    type: SignatureType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileUtils.validate(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const preview = await FileUtils.toBase64(file);
    const setter =
      type === "mengetahui" ? setSignatureMengetahui : setSignaturePenerima;

    setter((prev) => ({
      ...prev,
      upload: file,
      preview: { ...prev.preview, upload: preview },
    }));
  };

  const removeUploadedSignature = (type: SignatureType) => {
    const setter =
      type === "mengetahui" ? setSignatureMengetahui : setSignaturePenerima;
    setter((prev) => ({
      ...prev,
      upload: null,
      preview: { ...prev.preview, upload: null },
    }));
  };

  const saveSignature = (type: SignatureType) => {
    const ref =
      type === "mengetahui" ? signatureRefMengetahui : signatureRefPenerima;
    const setter =
      type === "mengetahui" ? setSignatureMengetahui : setSignaturePenerima;

    if (ref.current && !ref.current.isEmpty()) {
      const dataURL = ref.current.toDataURL();
      setter((prev) => ({
        ...prev,
        signature: dataURL,
        preview: { ...prev.preview, signature: dataURL },
      }));
    } else {
      alert("Mohon buat tanda tangan terlebih dahulu");
    }
  };

  const clearSignature = (type: SignatureType) => {
    const ref =
      type === "mengetahui" ? signatureRefMengetahui : signatureRefPenerima;
    const setter =
      type === "mengetahui" ? setSignatureMengetahui : setSignaturePenerima;

    if (ref.current) {
      ref.current.clear();
      setter((prev) => ({
        ...prev,
        signature: null,
        preview: { ...prev.preview, signature: null },
      }));
    }
  };

  const isSPV = user?.role?.name === "Spv";
  const isGI = user?.role?.name === "Gardu Induk";
  const isSpvNeedSignature =
    isSPV &&
    selectedItem?.surat_jalan.kategori_surat ===
      "Berita Acara Material Bongkaran";

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
                      isSPV || isGI ? "Detail" : "Status",
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
                        {formatDateTime(getTanggalSurat(item))}
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
                        {isSPV || isGI ? (
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
                    {isSPV || isGI ? (
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
                    {formatDateTime(getTanggalSurat(row))}
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

      {/* Dialog from shadcn - Made Responsive with max-height */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#353739]">
              {isSPV
                ? selectedItem?.surat_jalan.kategori_surat === "Surat Jalan"
                  ? "Detail Surat Jalan"
                  : "Detail Berita Acara Material Bongkaran"
                : isGI
                ? "Detail Berita Acara Material Bongkaran"
                : "Detail Surat"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detail informasi surat jalan dan approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* No Surat Jalan */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                {isSPV
                  ? selectedItem?.surat_jalan.kategori_surat === "Surat Jalan"
                    ? "No Surat Jalan"
                    : "No Berita Acara Material Bongkaran"
                  : isGI
                  ? "No Berita Acara Material Bongkaran"
                  : "No Surat"}
              </label>
              <p className="text-base font-semibold text-[#353739] bg-gray-50 p-3 rounded-lg">
                {selectedItem && getNoSurat(selectedItem)}
              </p>
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Tanggal
              </label>
              <p className="text-base text-[#545454]">
                {selectedItem && formatDateTime(getTanggalSurat(selectedItem))}
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
            {showRejectForm ? (
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
            ) : (
              <>
                {/* Tampilkan signature section hanya untuk Gardu Induk */}
                {(isGI || isSpvNeedSignature) && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-[#353739] mb-3">
                      Tanda Tangan Penerima *
                    </h3>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid grid-cols-2 w-full mb-3 h-auto">
                        <TabsTrigger
                          value="upload"
                          className="text-xs sm:text-sm py-2 px-2 sm:px-4"
                        >
                          Upload File
                        </TabsTrigger>
                        <TabsTrigger
                          value="draw"
                          className="text-xs sm:text-sm py-2 px-2 sm:px-4"
                        >
                          Gambar
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab Upload */}
                      {isGI ? (
                        <>
                          <TabsContent value="upload" className="space-y-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleFileUpload(e, "mengetahui")
                              }
                              className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
                            />
                            <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                              {previewMengetahui?.upload ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={previewMengetahui.upload}
                                    alt="Preview Tanda Tangan"
                                    className="w-full h-full object-contain"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      removeUploadedSignature("mengetahui")
                                    }
                                    className="absolute top-1 right-1 h-6 w-6 p-0 sm:top-2 sm:right-2 sm:h-8 sm:w-8"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 px-4">
                                  <div className="mb-2 text-lg sm:text-xl">
                                    📁
                                  </div>
                                  <div className="text-xs sm:text-sm">
                                    Preview Upload
                                  </div>
                                  <div className="text-xs mt-1">
                                    Format: JPG, PNG, GIF (Max 5MB)
                                  </div>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          {/* Tab Draw */}
                          <TabsContent value="draw" className="space-y-3">
                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white h-32 sm:h-40">
                              <SignatureCanvas
                                ref={signatureRefMengetahui}
                                penColor="black"
                                canvasProps={{
                                  className: "w-full h-full",
                                  style: { touchAction: "none" },
                                }}
                                backgroundColor="transparent"
                                onEnd={() => saveSignature("mengetahui")}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => clearSignature("mengetahui")}
                                className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                              >
                                🗑️ Hapus
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => saveSignature("mengetahui")}
                                className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                              >
                                💾 Simpan
                              </Button>
                            </div>
                            <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                              {previewMengetahui?.signature ? (
                                <img
                                  src={previewMengetahui.signature}
                                  alt="Signature Preview"
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs sm:text-sm text-center px-2">
                                  ✍️ Preview Signature
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </>
                      ) : (
                        <>
                          <TabsContent value="upload" className="space-y-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "penerima")}
                              className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
                            />
                            <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                              {previewPenerima?.upload ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={previewPenerima.upload}
                                    alt="Preview Tanda Tangan"
                                    className="w-full h-full object-contain"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      removeUploadedSignature("penerima")
                                    }
                                    className="absolute top-1 right-1 h-6 w-6 p-0 sm:top-2 sm:right-2 sm:h-8 sm:w-8"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 px-4">
                                  <div className="mb-2 text-lg sm:text-xl">
                                    📁
                                  </div>
                                  <div className="text-xs sm:text-sm">
                                    Preview Upload
                                  </div>
                                  <div className="text-xs mt-1">
                                    Format: JPG, PNG, GIF (Max 5MB)
                                  </div>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          {/* Tab Draw */}
                          <TabsContent value="draw" className="space-y-3">
                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white h-32 sm:h-40">
                              <SignatureCanvas
                                ref={signatureRefPenerima}
                                penColor="black"
                                canvasProps={{
                                  className: "w-full h-full",
                                  style: { touchAction: "none" },
                                }}
                                backgroundColor="transparent"
                                onEnd={() => saveSignature("penerima")}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => clearSignature("penerima")}
                                className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                              >
                                🗑️ Hapus
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => saveSignature("penerima")}
                                className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                              >
                                💾 Simpan
                              </Button>
                            </div>
                            <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                              {previewPenerima?.signature ? (
                                <img
                                  src={previewPenerima.signature}
                                  alt="Signature Preview"
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs sm:text-sm text-center px-2">
                                  ✍️ Preview Signature
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </>
                      )}
                    </Tabs>
                  </div>
                )}
              </>
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
