"use client";

import { MouseEventHandler, useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  X,
  Download,
  Paperclip,
  Printer,
  Eye,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  DynamicEmailData,
  EmailDataAdmin,
  EmailDataVendor,
  EmailDataOther,
  FileAttachment,
  isVendorEmailData,
  getPerihal,
  getPerusahaanPenerima,
  getTanggalSurat,
} from "@/lib/interface";
import { EmailDetailBeritaPemeriksaan } from "./detail-email-berita-pemeriksaan";
import { useUserLogin } from "@/lib/user";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  FormData as SuratJalanFormData,
  MaterialForm as SuratJalanMaterialForm,
  SignatureData as SuratJalanSignatureData,
} from "@/lib/surat-jalan/surat-jalan.type";
import {
  FormData as BongkaranFormData,
  MaterialForm as BongkaranMaterialForm,
  SignatureData as BongkaranSignatureData,
} from "@/lib/surat-bongkaran/berita-bongkaran.type";

import { Button } from "./ui/button";
import Link from "next/link";

const formatDate = (dateString: string) => {
  if (!dateString) return "31 Januari 2025";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateWithDay = (dateString: string) => {
  if (!dateString) return "Senin, 31 Januari 2025";
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long", // tampilkan nama hari
    day: "2-digit", // tampilkan 01, 02, dst.
    month: "long", // nama bulan lengkap
    year: "numeric", // tahun lengkap
  });
};

// Helper function untuk mendapatkan tanggal dari surat (menggunakan helper dari interface)
const getTanggalSuratLocal = (item: DynamicEmailData) => {
  return getTanggalSurat(item) || item.surat_jalan.createdAt;
};

// Helper function untuk mendapatkan nomor surat
const getNoSurat = (item: DynamicEmailData) => {
  const kategori = item.surat_jalan.kategori_surat;

  if (kategori === "Berita Acara Material Bongkaran") {
    return (item as EmailDataVendor).surat_jalan.no_berita_acara ?? null;
  }

  if (kategori === "Berita Acara Pemeriksaan Tim Mutu") {
    return (item as EmailDataOther).surat_jalan.no_berita_acara ?? null;
  }

  return (item as EmailDataAdmin).surat_jalan.no_surat_jalan ?? null;
};

function getCompanyAbbreviation(fullName: string, maxLetters = 3): string {
  if (!fullName) return "";
  const words = fullName.split(" ").filter((w) => w.length > 0);
  const initials = words.map((w) => w[0].toUpperCase());
  return initials.slice(0, maxLetters).join("");
}

function formatDateTimeEN(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes}${ampm}`;
}

export const EmailDetail = ({
  email,
  isSend,
  isCanceled,
  handleCloseDetail,
  markEmailAsBookmarked,
}: {
  email: DynamicEmailData;
  isSend?: boolean;
  isCanceled?: boolean;
  handleCloseDetail: MouseEventHandler;
  markEmailAsBookmarked?: (id: string) => void;
}) => {
  const { user } = useUserLogin();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [localEmail, setLocalEmail] = useState<DynamicEmailData>(email);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Sync localEmail dengan prop email saat email berubah
  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

  // Handler untuk bookmark dengan optimistic update
  const handleBookmark = () => {
    if (!markEmailAsBookmarked) return;

    // Optimistic update: langsung update localEmail
    setLocalEmail((prevEmail) => ({
      ...prevEmail,
      email_statuses: prevEmail.email_statuses?.map((status) => {
        if (status.user.name === user?.name) {
          return {
            ...status,
            is_bookmarked: !status.is_bookmarked,
          };
        }
        return status;
      }),
    }));

    // Panggil fungsi dari parent untuk update backend dan emailList
    markEmailAsBookmarked(email.documentId);
  };

  // Convert email data to PreviewSection format
  // Hanya untuk Surat Jalan (bukan Berita Pemeriksaan)
  const kategori = email.surat_jalan.kategori_surat;
  const isSuratJalan = kategori === "Surat Jalan";
  const beritaPemeriksaan =
    kategori === "Berita Acara Pemeriksaan Tim Mutu"
      ? (email as EmailDataOther).surat_jalan
      : null;

  const formData: SuratJalanFormData = {
    nomorSuratJalan: getNoSurat(email),
    nomorSuratPermintaan: isSuratJalan
      ? (email as EmailDataAdmin).surat_jalan.no_surat_permintaan || ""
      : "",
    perihal: getPerihal(email),
    lokasiAsal: isSuratJalan
      ? (email as EmailDataAdmin).surat_jalan.lokasi_asal || ""
      : "",
    lokasiTujuan: isSuratJalan
      ? (email as EmailDataAdmin).surat_jalan.lokasi_tujuan || ""
      : "",
    informasiKendaraan: isSuratJalan
      ? (email as EmailDataAdmin).surat_jalan.informasi_kendaraan || ""
      : "",
    namaPengemudi: isSuratJalan
      ? (email as EmailDataAdmin).surat_jalan.nama_pengemudi || ""
      : "",
    tanggalSurat: getTanggalSuratLocal(email),
    perusahaanPenerima:
      isSuratJalan && "penerima" in (email as EmailDataAdmin).surat_jalan
        ? (email as EmailDataAdmin).surat_jalan.penerima.perusahaan_penerima
        : getPerusahaanPenerima(email),
    namaPenerima:
      isSuratJalan && "penerima" in (email as EmailDataAdmin).surat_jalan
        ? (email as EmailDataAdmin).surat_jalan.penerima.nama_penerima
        : "",
    departemenPengirim:
      isSuratJalan && "pengirim" in (email as EmailDataAdmin).surat_jalan
        ? (email as EmailDataAdmin).surat_jalan.pengirim.departemen_pengirim
        : "",
    namaPengirim:
      isSuratJalan && "pengirim" in (email as EmailDataAdmin).surat_jalan
        ? (email as EmailDataAdmin).surat_jalan.pengirim.nama_pengirim
        : "",
    catatanTambahan: getPerihal(email),
  };

  const materials: SuratJalanMaterialForm[] = email.surat_jalan.materials.map(
    (m, index) => ({
      id: index, // Ubah dari string ke number
      namaMaterial: m.nama,
      katalog: m.katalog,
      satuan: m.satuan,
      jumlah: m.jumlah.toString(),
      keterangan: m.keterangan,
    })
  );

  // Fix signature structure sesuai SignatureData interface
  // Hanya untuk Surat Jalan
  const signaturePenerima: SuratJalanSignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload:
        isSuratJalan &&
        "penerima" in (email as EmailDataAdmin).surat_jalan &&
        (email as EmailDataAdmin).surat_jalan.penerima?.ttd_penerima?.url
          ? `${apiUrl}${
              (email as EmailDataAdmin).surat_jalan.penerima.ttd_penerima.url
            }`
          : null,
    },
  };

  const signaturePengirim: SuratJalanSignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload:
        isSuratJalan &&
        "pengirim" in (email as EmailDataAdmin).surat_jalan &&
        (email as EmailDataAdmin).surat_jalan.pengirim?.ttd_pengirim?.url
          ? `${apiUrl}${
              (email as EmailDataAdmin).surat_jalan.pengirim.ttd_pengirim.url
            }`
          : null,
    },
  };

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (parseFloat(m.jumlah) || 0), 0);
  };

  const handleDownloadAttachment = async (
    fileUrl: string,
    fileName: string
  ) => {
    const fullUrl = `${apiUrl}${fileUrl}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Gagal mengunduh file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh lampiran. Silakan coba lagi.");
      console.error(err);
    }
  };

  const scaleToFit = (element: HTMLElement, targetHeightMM = 297) => {
    const targetHeightPx = targetHeightMM * 3.78;
    const actualHeightPx = element.scrollHeight;

    if (actualHeightPx > targetHeightPx) {
      const scale = targetHeightPx / actualHeightPx;
      element.style.transform = `scale(${scale})`;
      element.style.transformOrigin = "top left";
    } else {
      element.style.transform = "scale(1)";
    }
  };

  useEffect(() => {
    if (!isGeneratingPDF) return;

    const generatePDF = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const pages = document.querySelectorAll(".surat");
      if (!pages.length) {
        console.error("Preview element tidak ditemukan!");
        setIsGeneratingPDF(false);
        return;
      }

      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          // 🔹 Auto scale sebelum render
          scaleToFit(page);

          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            imageTimeout: 0,
          });

          // Reset transform agar tidak merusak tampilan asli
          page.style.transform = "";

          const imgData = canvas.toDataURL("image/png");
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        }

        pdf.save(`${formData.nomorSuratJalan || "surat-jalan"}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Gagal generate PDF. Silakan coba lagi.");
      } finally {
        // Selesai generate, hide preview
        setIsGeneratingPDF(false);
      }
    };

    generatePDF();
  }, [isGeneratingPDF, formData.nomorSuratJalan]);

  const handlePrintClick = () => {
    setIsGeneratingPDF(true);
  };

  const MATERIALS_PER_PAGE = 15;
  const hasMaterialData = () => {
    return materials.some(
      (m) => m.namaMaterial || m.katalog || m.satuan || m.jumlah || m.keterangan
    );
  };

  const lembarLabels = [
    "Pengirim Barang",
    "Penerima Barang",
    "Satpam",
    formData.lokasiTujuan,
  ];

  const renderHeader = (lembarIndex: number, lembarLabels: string[]) => (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          <Image
            src="/images/PLN-logo.png"
            alt="PLN Logo"
            width={90}
            height={90}
            className="w-[90px] h-[90px] object-contain"
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-[#232323] leading-tight">
            PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
          </div>
          <div className="text-sm font-semibold text-[#232323] leading-tight">
            UNIT PELAKSANA TRANSMISI BANDUNG
          </div>
        </div>
        <div className="flex-shrink-0 bg-[rgba(166,35,68,0.1)] px-4 py-1.5 rounded-lg border border-[rgb(166,35,68)]">
          <div className="text-lg font-bold text-[rgb(166,35,68)] leading-tight">
            LEMBAR {lembarIndex + 1}
          </div>
          <div className="text-base text-[rgb(166,35,68)] leading-tight">
            {lembarLabels[lembarIndex]}
          </div>
        </div>
      </div>
      <hr className="border-t-2 border-gray-800 mb-3" />
    </>
  );

  const renderTitleAndInfo = () => (
    <>
      <div className="text-center mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          SURAT JALAN
        </h1>
        <div className="text-blue-600 font-semibold text-xl">
          {formData.nomorSuratJalan || "NO Surat Jalan"}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 text-base">
          Mohon diizinkan membawa barang-barang tersebut di bawah ini :
        </div>

        <div className="space-y-0.5 text-base">
          <div className="flex">
            <div className="min-w-[170px]">No Surat Permintaan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.nomorSuratPermintaan || "(No Surat Permintaan)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Untuk Keperluan</div>
            <div className="flex-1">
              :{" "}
              <span className="font-semibold">
                {formData.perihal || "(Perihal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Lokasi Asal</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiAsal || "(Lokasi Asal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Lokasi Tujuan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiTujuan || "(Lokasi Tujuan)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render footer with signatures
  const renderFooter = () => (
    <>
      <div className="pb-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold">Keterangan :</div>
      </div>
      <div className="py-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold">
          {formData.catatanTambahan || "(Catatan Tambahan)"}
        </div>
      </div>

      <div className="pl-2 grid grid-cols-2 gap-8 mb-6 text-base py-2">
        <div className="table">
          <div className="table-row">
            <div className="table-cell pr-4 font-semibold">Kendaraan</div>
            <div className="table-cell">
              : {formData.informasiKendaraan || "(Kendaraan)"}
            </div>
          </div>
          <div className="table-row">
            <div className="table-cell pr-4 font-semibold">Pengemudi</div>
            <div className="table-cell">
              : {formData.namaPengemudi || "(Pengemudi)"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div>
            Bandung, {formatDate(formData.tanggalSurat) || "(1 November 2025)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 text-center">
        <div>
          <div className="mb-1.5 text-base">Yang Menerima,</div>
          <div className="font-bold mb-3 text-base">
            {formData.perusahaanPenerima || "(Perusahaan Penerima)"}
          </div>

          <div className="h-20 mb-3 flex items-center justify-center">
            {signaturePenerima.preview.upload ? (
              <img
                src={signaturePenerima.preview.upload}
                alt="Signature Penerima"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-sm">(Tanda Tangan)</div>
            )}
          </div>

          <div className="text-base font-bold">
            {formData.namaPenerima || "(Nama Penerima)"}
          </div>
        </div>

        <div className="relative">
          <div className="mb-1.5 text-base">Yang Menyerahkan,</div>
          <div className="font-bold mb-3 text-base">
            {formData.departemenPengirim || "(Departemen Pengirim)"}
          </div>
          <Image
            src={`/images/ttd.png`}
            alt="TTD"
            width={120}
            height={120}
            className="absolute z-0 left-16 bottom-4"
          />
          <div className="h-20 mb-3 flex items-center justify-center">
            {signaturePengirim.preview.upload ? (
              <img
                src={signaturePengirim.preview.upload!}
                alt="Signature Pengirim"
                className="max-h-full max-w-full object-contain z-20"
              />
            ) : (
              <div className="text-gray-400 text-sm">(Tanda Tangan)</div>
            )}
          </div>

          <div className="font-bold text-base">
            {formData.namaPengirim || "(Nama Pengirim)"}
          </div>
        </div>
      </div>
    </>
  );

  const MATERIAL_THRESHOLD = 8;
  const MATERIALS_PER_PAGE_WITHOUT_FOOTER = 18;

  const splitMaterialsIntoPages = () => {
    const totalMaterials = materials.length;

    // Jika material <= 8, semua di halaman pertama dengan footer
    if (totalMaterials <= MATERIAL_THRESHOLD) {
      return [
        {
          materials: materials,
          showFooter: true,
          isFirstPage: true,
        },
      ];
    }

    // Jika material > 8, maksimalkan halaman pertama dan footer di halaman terpisah
    const pages = [];
    let remainingMaterials = [...materials];

    // Halaman pertama: maksimalkan (sekitar 18 baris, tanpa footer)
    const firstPageMaterials = remainingMaterials.slice(
      0,
      MATERIALS_PER_PAGE_WITHOUT_FOOTER
    );
    pages.push({
      materials: firstPageMaterials,
      showFooter: false,
      isFirstPage: true,
    });
    remainingMaterials = remainingMaterials.slice(
      MATERIALS_PER_PAGE_WITHOUT_FOOTER
    );

    // Halaman tengah (jika ada)
    while (remainingMaterials.length > MATERIALS_PER_PAGE_WITHOUT_FOOTER) {
      const nextPageMaterials = remainingMaterials.slice(
        0,
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
      pages.push({
        materials: nextPageMaterials,
        showFooter: false,
        isFirstPage: false,
      });
      remainingMaterials = remainingMaterials.slice(
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
    }

    // Halaman terakhir: sisa material + footer
    if (remainingMaterials.length > 0) {
      pages.push({
        materials: remainingMaterials,
        showFooter: true,
        isFirstPage: false,
      });
    } else {
      // Jika tidak ada sisa, footer di halaman kosong
      pages.push({
        materials: [],
        showFooter: true,
        isFirstPage: false,
      });
    }

    return pages;
  };

  const materialPages = splitMaterialsIntoPages();

  return (
    <>
      <div className="plus-jakarta-sans flex-1 bg-white rounded-xl w-full shadow-md py-6 px-4 max-w-full overflow-hidden">
        {/* Header */}
        {isSend || isCanceled ? (
          <>
            {/* Subject and Date */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {getPerihal(email)}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  {!isCanceled ? (
                    <></>
                  ) : (
                    <div className="px-2 py-1 bg-[#A6234433] rounded-2xl">
                      <p className="text-[#A62344] text-xs sm:text-sm font-medium">
                        Dibatalkan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kode Lainnya */}

            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium bg-blue-500`}
                >
                  {getCompanyAbbreviation(
                    isSuratJalan &&
                      "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .departemen_pengirim
                      : ""
                  ) || "GA"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {isSuratJalan &&
                    "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .departemen_pengirim
                      : "(Departmen Pengirim)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {getPerusahaanPenerima(email) || "(Perusahaan Penerima)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium bg-blue-500`}
                >
                  {getCompanyAbbreviation(
                    isSuratJalan &&
                      "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .departemen_pengirim
                      : beritaPemeriksaan?.pemeriksa_barang
                          ?.departemen_pemeriksa || ""
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {isSuratJalan &&
                    "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .departemen_pengirim
                      : beritaPemeriksaan?.pemeriksa_barang
                          ?.departemen_pemeriksa || "(Departemen Pengirim)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {getPerusahaanPenerima(email) || "(Perusahaan Penerima)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {getPerihal(email) || "(Perihal)"}
                </h2>
              </div>
            </div>
          </>
        )}

        {/* Email Content */}
        <div className="inter mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#191919]">
              {getNoSurat(email)}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#7F7F7F]">
              {formatDateTimeEN(getTanggalSuratLocal(email))}
            </span>
          </div>
          <p className="text-[#181818] text-xs sm:text-sm md:text-base">
            {email.pesan || ""}
          </p>
        </div>

        <hr className="border-t-4 border-gray-800 mb-6" />

        <div className="mb-6 md:mb-8">
          <div className="w-full transform origin-top-left">
            {/* Fixed width document preview */}
            <div className="bg-white py-4">
              {/* Company Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center">
                  <Image
                    src={`/images/PLN-logo.png`}
                    alt="PLN Logo"
                    width={104}
                    height={104}
                    className="w-[104px] h-[104px] object-cover"
                  />
                </div>
                <div>
                  <div className="plus-jakarta-sans text-base font-semibold text-[#232323]">
                    PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
                  </div>
                  <div className="plus-jakarta-sans text-base font-semibold text-[#232323]">
                    UNIT PELAKSANA TRANSMISI BANDUNG
                  </div>
                </div>
                <div className="ml-auto bg-[#A623441A] px-6 py-2 rounded-lg border border-[#A62344]">
                  <div className="plus-jakarta-sans text-[22px] font-bold text-[#A62344]">
                    LEMBAR I
                  </div>
                  <div className="plus-jakarta-sans text-xl text-[#A62344]">
                    Pengirim Barang
                  </div>
                </div>
              </div>

              <hr className="border-t-2 border-gray-800 mb-3" />

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  SURAT JALAN
                </h1>
                <div className="text-blue-600 font-semibold text-2xl">
                  {getNoSurat(email) || "(No Surat Jalan)"}
                </div>
              </div>

              {/* Form Information */}
              <div className="grid grid-cols-1 gap-8 mb-6 text-sm">
                <div>
                  <div className="mb-2 text-lg">
                    Mohon diizinkan membawa barang-barang tersebut di bawah ini
                    :
                  </div>
                  <div className="space-y-1 text-lg">
                    <div className="flex">
                      <div className="min-w-[180px]">No Surat Permintaan</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.nomorSuratPermintaan ||
                            "(No Surat Permintaan)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Untuk Keperluan</div>
                      <div className="flex-1">
                        :{" "}
                        <span className="font-semibold">
                          {formData.perihal || "(Perihal)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Lokasi Asal</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.lokasiAsal || "(Lokasi Asal)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Lokasi Tujuan</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.lokasiTujuan || "(Lokasi Tujuan)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Materials Table */}
              <div className="mb-3 min-w-[300px] overflow-x-auto">
                <table className="border-t border-b border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-lg text-center">
                      <th className="border-2 border-gray-800  px-2 py-2">
                        NO
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        NAMA MATERIAL
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        KATALOG
                      </th>
                      <th className="border-2 border-gray-800  px-2 py-2">
                        SATUAN
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        JUMLAH
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        KETERANGAN (LOKASI TYPE, S/N DLL)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    <>
                      {email.surat_jalan.materials.map((item, index) => (
                        <tr key={index}>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            {item.nama}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.katalog}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.satuan}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.jumlah}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.keterangan}
                          </td>
                        </tr>
                      ))}
                    </>
                    <tr className="bg-gray-100 font-semibold">
                      <td
                        colSpan={4}
                        className="border-2 border-gray-800 px-2 py-2 text-center"
                      >
                        TOTAL
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2 text-center">
                        {email.surat_jalan.materials.reduce(
                          (acc, item) => acc + item.jumlah,
                          0
                        )}
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pb-3 pl-3 text-sm flex items-center gap-3 border-b-2 border-gray-800">
                <div className="text-lg font-semibold">Keterangan :</div>
              </div>
              <div className="py-3 pl-3 text-sm flex items-center gap-3 border-b-2 border-gray-800">
                <div className="mt-1 text-lg font-semibold">
                  {getPerihal(email) || "(Perihal)"}
                </div>
              </div>

              {/* Vehicle and Driver Info */}
              <div className="pl-3 grid grid-cols-2 gap-8 mb-8 text-lg py-3">
                {/* Kolom kiri */}
                <div className="table">
                  <div className="table-row">
                    <div className="table-cell pr-4 font-semibold">
                      Kendaraan
                    </div>
                    <div className="table-cell">
                      : {formData.informasiKendaraan || "(Kendaraan)"}
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="table-cell pr-4 font-semibold">
                      Pengemudi
                    </div>
                    <div className="table-cell">
                      : {formData.namaPengemudi || "(Pengemudi)"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div>
                    Bandung, {formatDate(formData.tanggalSurat) || "1 Nov 2025"}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-16 text-sm text-center">
                <div>
                  <div className="mb-2 text-lg">Yang Menerima,</div>
                  <div className="font-bold mb-4 text-lg">
                    {isSuratJalan &&
                    "penerima" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.penerima
                          .perusahaan_penerima
                      : getPerusahaanPenerima(email) ||
                        "(Nama Departemen Penerima)"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-center">
                    {isSuratJalan &&
                    "penerima" in (email as EmailDataAdmin).surat_jalan &&
                    (email as EmailDataAdmin).surat_jalan.penerima?.ttd_penerima
                      ?.url ? (
                      <img
                        width={200}
                        height={200}
                        src={`${process.env.NEXT_PUBLIC_API_URL}${
                          (email as EmailDataAdmin).surat_jalan.penerima
                            .ttd_penerima.url
                        }`}
                        alt="TTD penerima"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold">
                    {isSuratJalan &&
                    "penerima" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.penerima
                          .nama_penerima || "Nama Penerima"
                      : "Nama Penerima"}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-lg">Yang menyerahkan,</div>
                  <div className="font-bold mb-4 text-lg">
                    {isSuratJalan &&
                    "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .departemen_pengirim
                      : "(Nama Departemen Pengirim)"}
                  </div>

                  {/* Signature Preview */}
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    {isSuratJalan &&
                    "pengirim" in (email as EmailDataAdmin).surat_jalan &&
                    (email as EmailDataAdmin).surat_jalan.pengirim?.ttd_pengirim
                      ?.url ? (
                      <>
                        <Image
                          src={`/images/ttd.png`}
                          alt="TTD"
                          width={100}
                          height={100}
                          className="absolute z-0"
                        />
                        <img
                          width={200}
                          height={200}
                          src={`${process.env.NEXT_PUBLIC_API_URL}${
                            (email as EmailDataAdmin).surat_jalan.pengirim
                              .ttd_pengirim.url
                          }`}
                          alt="TTD pengirim"
                          className="max-h-full max-w-full object-contain z-10"
                        />
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-lg">
                    {isSuratJalan &&
                    "pengirim" in (email as EmailDataAdmin).surat_jalan
                      ? (email as EmailDataAdmin).surat_jalan.pengirim
                          .nama_pengirim || "Nama Pengirim"
                      : "Nama Pengirim"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-b-4 border-gray-800 mb-6" />

        <div className="hidden w-full mb-6 md:mb-8">
          {/* Document Thumbnail Card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group">
            {/* Thumbnail Preview */}
            <div className="relative bg-gray-50 h-32 sm:h-40 md:h-48 flex items-center justify-center overflow-hidden">
              {/* Overlay with hover effect */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-2 shadow-lg">
                  <Eye className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="p-3 sm:p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      Surat Jalan - 001.SJ/GD.UPT-BDG/IX/2025
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      Pemakaian Material Kabel Kontrol
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <button className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                  <button className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {(() => {
          const suratJalan = email.surat_jalan as any;
          const hasLampiran =
            "lampiran" in suratJalan &&
            suratJalan.lampiran &&
            Array.isArray(suratJalan.lampiran) &&
            suratJalan.lampiran.length > 0;

          if (!hasLampiran) return null;

          const lampiran = suratJalan.lampiran as FileAttachment[];

          return (
            <div className="mb-6 md:mb-8">
              <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm md:text-base">
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Lampiran ({lampiran.length})
              </h4>
              <div className="space-y-2">
                {lampiran.map((attachment: FileAttachment, index: number) => {
                  // Ambil ekstensi file (uppercase)
                  const ext =
                    attachment.name.split(".").pop()?.toUpperCase() || "";

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-bold text-red-600">
                            {ext}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDownloadAttachment(
                            attachment.url,
                            attachment.name
                          )
                        }
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        {user?.role?.name === "Admin" &&
          email.surat_jalan.status_surat === "Reject" && (
            <Link
              href={`/create-letter?mode=edit&id=${email.surat_jalan.documentId}`}
            >
              <Button variant="default" size="lg">
                Ubah Surat
              </Button>
            </Link>
          )}
      </div>

      {isGeneratingPDF && (
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            backgroundColor: "#ffffff",
            zIndex: -1,
          }}
        >
          <div id="hidden-preview-content">
            {/* Loop untuk setiap lembar (4 lembar) */}
            {[0, 1, 2, 3].map((lembarIndex) => (
              <div key={lembarIndex}>
                {/* Loop untuk setiap halaman material */}
                {materialPages.map((pageData, pageIndex) => {
                  const {
                    materials: pageMaterials,
                    showFooter,
                    isFirstPage,
                  } = pageData;

                  // Hitung nomor awal untuk halaman ini
                  let startIndex = 0;
                  for (let i = 0; i < pageIndex; i++) {
                    startIndex += materialPages[i].materials.length;
                  }

                  return (
                    <div
                      key={`${lembarIndex}-${pageIndex}`}
                      className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                      data-lembar={lembarIndex}
                      data-page={pageIndex}
                      style={{
                        padding: "15mm 15mm 15mm 15mm",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Header - ada di setiap halaman */}
                      {renderHeader(lembarIndex, lembarLabels)}

                      {/* Title dan Info - hanya di halaman pertama */}
                      {isFirstPage && renderTitleAndInfo()}

                      {/* Materials Table - jika ada material di halaman ini */}
                      {pageMaterials.length > 0 && (
                        <div className="mb-3">
                          <table
                            className="w-full border-collapse"
                            style={{ fontSize: "13px" }}
                          >
                            <thead className="bg-gray-100">
                              <tr className="text-center">
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "5%" }}
                                >
                                  NO
                                </th>
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "30%" }}
                                >
                                  NAMA MATERIAL
                                </th>
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "12%" }}
                                >
                                  KATALOG
                                </th>
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "10%" }}
                                >
                                  SATUAN
                                </th>
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "10%" }}
                                >
                                  JUMLAH
                                </th>
                                <th
                                  className="border-2 border-gray-800 px-1.5 py-1"
                                  style={{ width: "33%" }}
                                >
                                  KETERANGAN (LOKASI TYPE, S/N DLL)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageMaterials.map((material, idx) => (
                                <tr key={material.id || idx}>
                                  <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                    {startIndex + idx + 1}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1">
                                    {material.namaMaterial || "-"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                    {material.katalog || "-"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                    {material.satuan || "-"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                    {material.jumlah || "0"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                    {material.keterangan || "-"}
                                  </td>
                                </tr>
                              ))}

                              {/* Total row jika showFooter */}
                              {showFooter && (
                                <tr className="bg-gray-100 font-semibold">
                                  <td
                                    colSpan={4}
                                    className="border-2 border-gray-800 px-1.5 py-1.5 text-center"
                                  >
                                    TOTAL
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                    {calculateTotal()}
                                  </td>
                                  <td className="border-2 border-gray-800 px-1.5 py-1.5"></td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Footer jika showFooter */}
                      {showFooter && renderFooter()}

                      {/* Indikator halaman untuk multi-page */}
                      {materialPages.length > 1 && (
                        <div className="text-center text-gray-500 text-xs mt-2">
                          Halaman {pageIndex + 1} dari {materialPages.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const EmailDetailBeritaBongkaran = ({
  email,
  isSend,
  isCanceled,
  handleCloseDetail,
  markEmailAsBookmarked,
}: {
  email: EmailDataVendor;
  isSend?: boolean;
  isCanceled?: boolean;
  handleCloseDetail: MouseEventHandler;
  markEmailAsBookmarked?: (id: string) => void;
}) => {
  const { user } = useUserLogin();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [localEmail, setLocalEmail] = useState<EmailDataVendor>(email);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Sync localEmail dengan prop email saat email berubah
  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

  // Handler untuk bookmark dengan optimistic update
  const handleBookmark = () => {
    if (!markEmailAsBookmarked) return;

    // Optimistic update: langsung update localEmail
    setLocalEmail((prevEmail) => ({
      ...prevEmail,
      email_statuses: prevEmail.email_statuses?.map((status) => {
        if (status.user.name === user?.name) {
          return {
            ...status,
            is_bookmarked: !status.is_bookmarked,
          };
        }
        return status;
      }),
    }));

    // Panggil fungsi dari parent untuk update backend dan emailList
    markEmailAsBookmarked(email.documentId);
  };

  // Helper function untuk get file URL
  const getFileUrl = (
    fileAttachment: FileAttachment | null | undefined
  ): string => {
    if (!fileAttachment?.url) return "";
    if (
      fileAttachment.url.startsWith("http") ||
      fileAttachment.url.startsWith("https")
    )
      return fileAttachment.url;
    return `${apiUrl}${fileAttachment.url}`;
  };

  // Convert email data to PreviewSection format
  const formData: BongkaranFormData = {
    copSurat: getFileUrl(email.surat_jalan.cop_surat),
    nomorBeritaAcara: email.surat_jalan.no_berita_acara,
    nomorPerjanjianKontrak: email.surat_jalan.no_perjanjian_kontrak,
    tanggalKontrak: email.surat_jalan.tanggal_kontrak
      ? new Date(email.surat_jalan.tanggal_kontrak).toISOString().split("T")[0]
      : "",
    perihal: email.surat_jalan.perihal,
    lokasiAsal: email.surat_jalan.lokasi_asal,
    lokasiTujuan: email.surat_jalan.lokasi_tujuan,
    informasiKendaraan: email.surat_jalan.informasi_kendaraan,
    namaPengemudi: email.surat_jalan.nama_pengemudi,
    perusahaanPenerima: email.surat_jalan.penerima.perusahaan_penerima,
    namaPenerima: email.surat_jalan.penerima.nama_penerima,
    departemenPengirim: email.surat_jalan.pengirim.departemen_pengirim,
    namaPengirim: email.surat_jalan.pengirim.nama_pengirim,
    departemenMengetahui: email.surat_jalan.mengetahui.departemen_mengetahui,
    namaMengetahui: email.surat_jalan.mengetahui.nama_mengetahui,
  };

  const materials: BongkaranMaterialForm[] = email.surat_jalan.materials.map(
    (m, index) => ({
      id: index,
      namaMaterial: m.nama,
      katalog: m.katalog,
      satuan: m.satuan,
      jumlah: m.jumlah.toString(),
      keterangan: m.keterangan,
    })
  );

  const signaturePenerima: BongkaranSignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload: email.surat_jalan.penerima.ttd_penerima?.url || null,
    },
  };

  const signaturePengirim: BongkaranSignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload: email.surat_jalan.pengirim.ttd_pengirim.url,
    },
  };

  const signatureMengetahui: BongkaranSignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload: email.surat_jalan.mengetahui?.ttd_mengetahui?.url || null,
    },
  };

  const getCopSuratUrl = (): string | null => {
    if (!formData.copSurat) return null;

    if (typeof formData.copSurat === "string") {
      return formData.copSurat;
    }

    if (formData.copSurat instanceof File) {
      return URL.createObjectURL(formData.copSurat);
    }

    return null;
  };

  const copSuratUrl = getCopSuratUrl();

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (parseFloat(m.jumlah) || 0), 0);
  };

  const handleDownloadAttachment = async (
    fileUrl: string,
    fileName: string
  ) => {
    const fullUrl = `${apiUrl}${fileUrl}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Gagal mengunduh file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh lampiran. Silakan coba lagi.");
      console.error(err);
    }
  };

  // BREAK PAGE LOGIC - sama seperti PreviewSectionBeritaBongkaran
  const MATERIAL_THRESHOLD = 3;
  const MATERIALS_PER_PAGE_WITHOUT_FOOTER = 18;

  const splitMaterialsIntoPages = () => {
    const totalMaterials = materials.length;

    if (totalMaterials <= MATERIAL_THRESHOLD) {
      return [
        {
          materials: materials,
          showFooter: true,
          isFirstPage: true,
        },
      ];
    }

    const pages = [];
    let remainingMaterials = [...materials];

    const firstPageMaterials = remainingMaterials.slice(
      0,
      MATERIALS_PER_PAGE_WITHOUT_FOOTER
    );
    pages.push({
      materials: firstPageMaterials,
      showFooter: false,
      isFirstPage: true,
    });
    remainingMaterials = remainingMaterials.slice(
      MATERIALS_PER_PAGE_WITHOUT_FOOTER
    );

    while (remainingMaterials.length > MATERIALS_PER_PAGE_WITHOUT_FOOTER) {
      const nextPageMaterials = remainingMaterials.slice(
        0,
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
      pages.push({
        materials: nextPageMaterials,
        showFooter: false,
        isFirstPage: false,
      });
      remainingMaterials = remainingMaterials.slice(
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
    }

    if (remainingMaterials.length > 0) {
      pages.push({
        materials: remainingMaterials,
        showFooter: true,
        isFirstPage: false,
      });
    } else {
      pages.push({
        materials: [],
        showFooter: true,
        isFirstPage: false,
      });
    }

    return pages;
  };

  const materialPages = splitMaterialsIntoPages();

  // RENDER FUNCTIONS untuk PDF
  const renderHeaderPDF = (isFirstPage: boolean) => (
    <>
      {isFirstPage && (
        <div className="w-full mb-3">
          {copSuratUrl ? (
            <div className="cop-surat-container flex justify-center items-center w-full mb-4">
              <img
                src={copSuratUrl}
                alt="Cop Surat"
                className="w-full object-contain"
              />
            </div>
          ) : (
            <div className="font-bold text-2xl text-center">(Cop Surat)</div>
          )}
        </div>
      )}
      <hr className="border-t-2 border-gray-800 mb-3" />
    </>
  );

  const renderTitleAndInfoPDF = () => (
    <>
      <div className="text-center mb-3">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-0.5">
          Berita Acara Serah Terima Material Bongkaran
        </h1>
        <div className="text-blue-600 font-semibold text-lg">
          {formData.nomorBeritaAcara || "(No Berita Acara)"}
        </div>
      </div>

      <div className="mb-3">
        <div className="space-y-0.5 text-sm">
          <div className="flex">
            <div className="min-w-[150px]">Pada Hari ini</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formatDateWithDay(formData.tanggalKontrak) ||
                  "Senin, 01 September 2025"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Perihal</div>
            <div className="flex-1">
              :{" "}
              <span className="font-semibold">
                {formData.perihal || "(Perihal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Lokasi Asal</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiAsal || "(Lokasi Asal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Lokasi Tujuan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiTujuan || "(Lokasi Tujuan)"}
              </span>
            </div>
          </div>
          <div className="flex">
            <div className="min-w-[150px]">No Kontrak</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.nomorPerjanjianKontrak || "(No Kontrak)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderFooterPDF = () => (
    <>
      <div className="py-1.5 pl-2 border-b-2 border-gray-800">
        <div className="text-sm font-semibold">
          Demikian surat pemberitahuan ini kami sampaikan, atas perhatian dan
          kerjasamanya kami ucapkan terima kasih
        </div>
      </div>

      <div className="pl-2 grid grid-cols-2 gap-8 mb-4 text-sm py-1.5">
        <div className="table">
          <div className="table-row">
            <div className="table-cell pr-4 font-semibold">Kendaraan</div>
            <div className="table-cell">
              : {formData.informasiKendaraan || "(Kendaraan)"}
            </div>
          </div>
          <div className="table-row">
            <div className="table-cell pr-4 font-semibold">Pengemudi</div>
            <div className="table-cell">
              : {formData.namaPengemudi || "(Pengemudi)"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div>
            Bandung, {formatDate(formData.tanggalKontrak) || "1 Nov 2025"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-center mb-4">
        <div className="relative">
          <div className="mb-1 text-sm">Yang Menerima,</div>
          <div className="font-bold mb-2 text-sm">
            {formData.perusahaanPenerima || "(Perusahaan Penerima)"}
          </div>
          <Image
            src={`/images/ttd.png`}
            alt="TTD"
            width={100}
            height={100}
            className="absolute z-0 left-16 bottom-3"
          />
          <div className="h-16 mb-2 flex items-center justify-center">
            {signaturePenerima.preview.upload ? (
              <img
                src={`${apiUrl}${signaturePenerima.preview.upload}`}
                alt="Signature Penerima"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
            )}
          </div>

          <div className="text-sm font-bold">
            {formData.namaPenerima || "(Nama Penerima)"}
          </div>
        </div>

        <div className="relative">
          <div className="mb-1 text-sm">Yang Menyerahkan,</div>
          <div className="font-bold mb-2 text-sm">
            {formData.departemenPengirim || "(Departemen Pengirim)"}
          </div>
          <div className="h-16 mb-2 flex items-center justify-center">
            {signaturePengirim.preview.upload ? (
              <img
                src={`${apiUrl}${signaturePengirim.preview.upload}`}
                alt="Signature Pengirim"
                className="max-h-full max-w-full object-contain z-20"
              />
            ) : (
              <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
            )}
          </div>

          <div className="font-bold text-sm">
            {formData.namaPengirim || "(Nama Pengirim)"}
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="mb-1 text-sm">Yang Mengetahui,</div>
        <div className="font-bold mb-2 text-sm">
          {formData.departemenMengetahui || "(Departemen Mengetahui)"}
        </div>

        <div className="h-16 mb-2 flex items-center justify-center">
          {signatureMengetahui.preview.upload ? (
            <img
              src={`${apiUrl}${signatureMengetahui.preview.upload}`}
              alt="Signature Mengetahui"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
          )}
        </div>

        <div className="text-sm font-bold">
          {formData.namaMengetahui || "(Nama Mengetahui)"}
        </div>
      </div>
    </>
  );

  const scaleToFit = (element: HTMLElement, targetHeightMM = 297) => {
    const targetHeightPx = targetHeightMM * 3.78;
    const actualHeightPx = element.scrollHeight;

    if (actualHeightPx > targetHeightPx) {
      const scale = targetHeightPx / actualHeightPx;
      element.style.transform = `scale(${scale})`;
      element.style.transformOrigin = "top left";
    } else {
      element.style.transform = "scale(1)";
    }
  };

  useEffect(() => {
    if (!isGeneratingPDF) return;

    const generatePDF = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const pages = document.querySelectorAll(".surat");
      if (!pages.length) {
        console.error("Preview element tidak ditemukan!");
        setIsGeneratingPDF(false);
        return;
      }

      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          scaleToFit(page);

          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            imageTimeout: 0,
          });

          page.style.transform = "";

          const imgData = canvas.toDataURL("image/png");
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        }

        pdf.save(
          `${
            formData.nomorBeritaAcara || "Berita Acara Pemeriksaan Tim Mutu"
          }.pdf`
        );
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Gagal generate PDF. Silakan coba lagi.");
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    generatePDF();
  }, [isGeneratingPDF, formData.nomorBeritaAcara]);

  const handlePrintClick = () => {
    setIsGeneratingPDF(true);
  };

  return (
    <>
      <div className="plus-jakarta-sans flex-1 bg-white rounded-xl w-full shadow-md py-6 px-4 max-w-full overflow-hidden">
        {/* Header - KODE YANG SAMA SEPERTI SEBELUMNYA */}
        {isSend || isCanceled ? (
          <>
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {email.surat_jalan.perihal}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  {!isCanceled ? (
                    <></>
                  ) : (
                    <div className="px-2 py-1 bg-[#A6234433] rounded-2xl">
                      <p className="text-[#A62344] text-xs sm:text-sm font-medium">
                        Dibatalkan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kode Lainnya */}

            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium bg-blue-500`}
                >
                  {getCompanyAbbreviation(
                    email.surat_jalan.pengirim.departemen_pengirim
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {email.surat_jalan.pengirim.departemen_pengirim ||
                      "(Departemen Pengirim)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {email.surat_jalan.penerima.perusahaan_penerima ||
                      "(Peruhasaan Penerima)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium bg-blue-500`}
                >
                  {getCompanyAbbreviation(
                    email.surat_jalan.pengirim.departemen_pengirim
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {email.surat_jalan.pengirim.departemen_pengirim ||
                      "(Departemen Pengirim)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {email.surat_jalan.penerima.perusahaan_penerima ||
                      "(Peruhasaan Penerima)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {email.surat_jalan.perihal || ""}
                </h2>
              </div>
            </div>
          </>
        )}

        {/* Email Content */}
        <div className="inter mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#191919]">
              {formData.nomorBeritaAcara || "(NO Berita Acara)"}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#7F7F7F]">
              {formatDateWithDay(formData.tanggalKontrak) || "1 Nov 2025"}
            </span>
          </div>
          <p className="text-[#181818] text-xs sm:text-sm md:text-base">
            {email.pesan || ""}
          </p>
        </div>

        <hr className="border-t-4 border-gray-800 mb-6" />

        <div className="mb-6 md:mb-8">
          <div className="w-full transform origin-top-left">
            {/* Fixed width document preview */}
            <div className="bg-white py-4">
              {/* Company Header */}
              <div className="w-full mb-8">
                {copSuratUrl ? (
                  <div className="cop-surat-container flex justify-center items-center w-full mb-4">
                    <img
                      src={copSuratUrl}
                      alt="Cop Surat"
                      className="w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="font-bold text-2xl text-center">
                    (Cop Surat)
                  </div>
                )}
              </div>
              {/* <div className="ml-auto bg-[#A623441A] px-6 py-2 rounded-lg border border-[#A62344]">
                <div className="plus-jakarta-sans text-[22px] font-bold text-[#A62344]">
                  LEMBAR I
                </div>
                <div className="plus-jakarta-sans text-xl text-[#A62344]">
                  Pengirim Barang
                </div>
              </div> */}

              <hr className="border-t-2 border-gray-800 mb-4" />

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Berita Acara Serah Terima Material Bongkaran
                </h1>
                <div className="text-blue-600 font-semibold text-2xl">
                  {formData.nomorBeritaAcara || "(No Berita Acara)"}
                </div>
              </div>

              {/* Form Information */}
              <div className="grid grid-cols-1 gap-8 mb-6 text-sm">
                <div>
                  <div className="space-y-1 text-lg">
                    <div className="flex">
                      <div className="min-w-[180px]">Pada hari ini</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formatDateWithDay(formData.tanggalKontrak) ||
                            "Senin, 01 September 2025"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Perihal</div>
                      <div className="flex-1">
                        :{" "}
                        <span className="font-semibold">
                          {formData.perihal || "(Perihal)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Lokasi Asal</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.lokasiAsal || "(Lokasi Asal)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="min-w-[180px]">Lokasi Tujuan</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.lokasiTujuan || "(Lokasi Tujuan)"}
                        </span>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="min-w-[180px]">No Kontrak</div>
                      <div>
                        :{" "}
                        <span className="font-semibold">
                          {formData.nomorPerjanjianKontrak || "(No Kontrak)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Materials Table */}
              <div className="mb-3 min-w-[300px] overflow-x-auto">
                <table className="border-t border-b border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-lg text-center">
                      <th className="border-2 border-gray-800  px-2 py-2">
                        NO
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        NAMA MATERIAL
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        KATALOG
                      </th>
                      <th className="border-2 border-gray-800  px-2 py-2">
                        SATUAN
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        JUMLAH
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        KETERANGAN (LOKASI TYPE, S/N DLL)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    <>
                      {email.surat_jalan.materials.map((item, index) => (
                        <tr key={index}>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            {item.nama}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.katalog}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.satuan}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.jumlah}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.keterangan}
                          </td>
                        </tr>
                      ))}
                    </>
                    <tr className="bg-gray-100 font-semibold">
                      <td
                        colSpan={4}
                        className="border-2 border-gray-800 px-2 py-2 text-center"
                      >
                        TOTAL
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2 text-center">
                        {email.surat_jalan.materials.reduce(
                          (acc, item) => acc + item.jumlah,
                          0
                        )}
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="py-3 pl-3 text-sm flex items-center gap-3 border-b-2 border-gray-800">
                <div className="mt-1 text-lg font-semibold">
                  Demikian surat pemberitahuan ini kami sampaikan, atas
                  perhatian dan kerjasamanya kami ucapkan terima kasih
                </div>
              </div>

              {/* Vehicle and Driver Info */}
              <div className="pl-3 grid grid-cols-2 gap-8 mb-8 text-lg py-3">
                {/* Kolom kiri */}
                <div className="table">
                  <div className="table-row">
                    <div className="table-cell pr-4 font-semibold">
                      Kendaraan
                    </div>
                    <div className="table-cell">
                      : {formData.informasiKendaraan || "(Kendaraan)"}
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="table-cell pr-4 font-semibold">
                      Pengemudi
                    </div>
                    <div className="table-cell">
                      : {formData.namaPengemudi || "(Pengemudi)"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div>
                    Bandung,{" "}
                    {formatDate(formData.tanggalKontrak) || "(Tanggal Kontrak)"}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-16 text-sm text-center">
                <div>
                  <div className="mb-2 text-lg">Yang Menerima,</div>
                  <div className="font-bold mb-4 text-lg">
                    {email.surat_jalan.penerima.perusahaan_penerima ||
                      "Nama Departemen Penerima"}
                  </div>

                  {/* Signature Preview */}
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    {email.surat_jalan.penerima.ttd_penerima?.url ? (
                      <>
                        <Image
                          src={`/images/ttd.png`}
                          alt="TTD"
                          width={100}
                          height={100}
                          className="absolute z-0"
                        />
                        <img
                          width={200}
                          height={200}
                          src={`${process.env.NEXT_PUBLIC_API_URL}${email.surat_jalan.penerima.ttd_penerima?.url}`}
                          alt="TTD penerima"
                          className="max-h-full max-w-full object-contain"
                        />
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold">
                    {`${
                      email.surat_jalan.penerima.nama_penerima ||
                      "Nama Penerima"
                    }`}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-lg">Yang menyerahkan,</div>
                  <div className="font-bold mb-4 text-lg">
                    {email.surat_jalan.pengirim.departemen_pengirim ||
                      "Nama Departemen Pengirim"}
                  </div>

                  {/* Signature Preview */}
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    {email.surat_jalan.pengirim.ttd_pengirim.url ? (
                      <>
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${email.surat_jalan.pengirim.ttd_pengirim.url}`}
                          alt="TTD pengirim"
                          className="max-h-full max-w-full object-contain z-10"
                        />
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-lg">
                    {email.surat_jalan.pengirim.nama_pengirim ||
                      "Nama Pengirim"}
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center pt-10 text-center">
                <div>
                  <div className="mb-2 text-lg">Yang Mengetahui,</div>
                  <div className="font-bold mb-4 text-lg">
                    {email.surat_jalan.mengetahui?.departemen_mengetahui ||
                      "Nama Departemen Mengetahui"}
                  </div>

                  {/* Signature Preview */}
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    {email.surat_jalan.mengetahui?.ttd_mengetahui?.url ? (
                      <>
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${email.surat_jalan.mengetahui?.ttd_mengetahui.url}`}
                          alt="TTD mengetahui"
                          className="max-h-full max-w-full object-contain z-10"
                        />
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-lg text-center">
                    {email.surat_jalan.mengetahui?.nama_mengetahui ||
                      "Nama Mengetahui"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-b-4 border-gray-800 mb-6" />

        {/* Attachments */}
        {(() => {
          const suratJalan = email.surat_jalan as any;
          const hasLampiran =
            "lampiran" in suratJalan &&
            suratJalan.lampiran &&
            Array.isArray(suratJalan.lampiran) &&
            suratJalan.lampiran.length > 0;

          if (!hasLampiran) return null;

          const lampiran = suratJalan.lampiran as FileAttachment[];

          return (
            <div className="mb-6 md:mb-8">
              <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm md:text-base">
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Lampiran ({lampiran.length})
              </h4>
              <div className="space-y-2">
                {lampiran.map((attachment: FileAttachment, index: number) => {
                  // Ambil ekstensi file (uppercase)
                  const ext =
                    attachment.name.split(".").pop()?.toUpperCase() || "";

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-bold text-red-600">
                            {ext}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDownloadAttachment(
                            attachment.url,
                            attachment.name
                          )
                        }
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        {(user?.role?.name === "Admin" || user?.role?.name === "Vendor") &&
          email.surat_jalan.status_surat === "Reject" && (
            <Link
              href={
                user.role.name === "Admin"
                  ? `/create-letter?mode=edit&id=${email.surat_jalan.documentId}`
                  : `/create-letter-bongkaran?mode=edit&id=${email.surat_jalan.documentId}`
              }
            >
              <Button variant="default" size="lg">
                Ubah Surat
              </Button>
            </Link>
          )}
      </div>

      {isGeneratingPDF && (
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            backgroundColor: "#ffffff",
            zIndex: -1,
          }}
        >
          <div id="hidden-preview-content">
            {materialPages.map((pageData, pageIndex) => {
              const {
                materials: pageMaterials,
                showFooter,
                isFirstPage,
              } = pageData;

              let startIndex = 0;
              for (let i = 0; i < pageIndex; i++) {
                startIndex += materialPages[i].materials.length;
              }

              return (
                <div
                  key={pageIndex}
                  className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  data-page={pageIndex}
                  style={{
                    padding: "15mm 15mm 15mm 15mm",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header */}
                  {renderHeaderPDF(isFirstPage)}

                  {/* Title dan Info - hanya di halaman pertama */}
                  {isFirstPage && renderTitleAndInfoPDF()}

                  {/* Materials Table */}
                  {pageMaterials.length > 0 && (
                    <div className="mb-2">
                      <table
                        className="w-full border-collapse"
                        style={{ fontSize: "12px" }}
                      >
                        <thead className="bg-gray-100">
                          <tr className="text-center">
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "5%" }}
                            >
                              NO
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "30%" }}
                            >
                              NAMA MATERIAL
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "12%" }}
                            >
                              KATALOG
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "10%" }}
                            >
                              SATUAN
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "10%" }}
                            >
                              JUMLAH
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "33%" }}
                            >
                              KETERANGAN (LOKASI TYPE, S/N DLL)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageMaterials.map((material, idx) => (
                            <tr key={material.id || idx}>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {startIndex + idx + 1}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1">
                                {material.namaMaterial || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.katalog || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.satuan || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.jumlah || "0"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.keterangan || "-"}
                              </td>
                            </tr>
                          ))}

                          {/* Total row jika showFooter */}
                          {showFooter && (
                            <tr className="bg-gray-100 font-semibold">
                              <td
                                colSpan={4}
                                className="border-2 border-gray-800 px-1.5 py-1 text-center"
                              >
                                TOTAL
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {calculateTotal()}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1"></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer jika showFooter */}
                  {showFooter && renderFooterPDF()}

                  {/* Indikator halaman */}
                  {materialPages.length > 1 && (
                    <div className="text-center text-gray-500 text-xs mt-2">
                      Halaman {pageIndex + 1} dari {materialPages.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
