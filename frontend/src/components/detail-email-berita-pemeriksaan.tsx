"use client";

import { MouseEventHandler, useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  X,
  Printer,
} from "lucide-react";
import {
  EmailDataOther,
  FileAttachment,
  BeritaPemeriksaan,
} from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
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
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

// Helper function untuk parse kelengkapan dokumen dari markdown
const parseKelengkapanFromMarkdown = (markdown: string): string[] => {
  if (!markdown) return [];

  const lines = markdown.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const trimmed = line.trim();
    return trimmed;
  });
};

// Helper function untuk get file URL
const getFileUrl = (
  fileAttachment: FileAttachment | null | undefined,
  apiUrl: string
): string => {
  if (!fileAttachment?.url) return "";
  if (fileAttachment.url.startsWith("http")) return fileAttachment.url;
  return `${apiUrl}${fileAttachment.url}`;
};

export const EmailDetailBeritaPemeriksaan = ({
  email,
  isSend,
  isCanceled,
  handleCloseDetail,
  markEmailAsBookmarked,
}: {
  email: EmailDataOther;
  isSend?: boolean;
  isCanceled?: boolean;
  handleCloseDetail: MouseEventHandler;
  markEmailAsBookmarked?: (id: string) => void;
}) => {
  const { user } = useUserLogin();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [localEmail, setLocalEmail] = useState<EmailDataOther>(email);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

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

  const beritaPemeriksaan: BeritaPemeriksaan = email.surat_jalan;

  // Parse kelengkapan dokumen
  const kelengkapanDokumen = parseKelengkapanFromMarkdown(
    beritaPemeriksaan.kelengkapan_dokumen || ""
  );

  // Check if materials <= 3 for compact spacing
  const isCompactMode = beritaPemeriksaan.materials.length <= 3;

  // Split materials into pages dengan logic yang sama dengan preview
  const splitMaterialsIntoPages = () => {
    const totalMaterials = beritaPemeriksaan.materials.length;
    const kelengkapanCount = kelengkapanDokumen.length;

    // Logika break page:
    // - Jika kelengkapan <= 2: tetap satu halaman kecuali material >= 4
    // - Jika kelengkapan > 2: break page jika material >= 2
    
    let shouldBreakPage = false;
    let materialsThreshold = 3;
    
    if (kelengkapanCount <= 2) {
      // Kelengkapan sedikit: bisa muat lebih banyak material di satu halaman
      materialsThreshold = 3; // Tetap satu halaman jika material <= 3
      shouldBreakPage = totalMaterials > materialsThreshold;
    } else {
      // Kelengkapan banyak (> 2): break page jika material >= 2
      materialsThreshold = 1; // Break jika material >= 2
      shouldBreakPage = totalMaterials >= 2;
    }
    
    // Jika tidak perlu break page, semua dalam satu halaman
    if (!shouldBreakPage) {
      return [
        {
          materials: beritaPemeriksaan.materials,
          showIntro: true,
          showKelengkapan: true,
          showClosing: true,
          showSignature: true,
          isFirstPage: true,
          isLastPage: true,
        },
      ];
    }

    // Jika perlu break page, mulai split
    const pages = [];
    let remainingMaterials = [...beritaPemeriksaan.materials];

    // Tentukan berapa material di halaman pertama
    let materialsFirstPage = 2;
    if (kelengkapanCount <= 2) {
      materialsFirstPage = 3; // Lebih banyak material jika kelengkapan sedikit
    } else if (kelengkapanCount <= 5) {
      materialsFirstPage = 2;
    } else {
      materialsFirstPage = 2; // Kelengkapan banyak, material sedikit di halaman 1
    }

    // Halaman pertama
    const firstPageMaterials = remainingMaterials.slice(0, materialsFirstPage);
    remainingMaterials = remainingMaterials.slice(materialsFirstPage);

    pages.push({
      materials: firstPageMaterials,
      showIntro: true,
      showKelengkapan: true,
      showClosing: false,
      showSignature: false,
      isFirstPage: true,
      isLastPage: false,
    });

    // Halaman tengah - 4 materials per halaman
    const MATERIALS_PER_MIDDLE_PAGE = 4;
    while (remainingMaterials.length > MATERIALS_PER_MIDDLE_PAGE) {
      const nextPageMaterials = remainingMaterials.slice(0, MATERIALS_PER_MIDDLE_PAGE);
      pages.push({
        materials: nextPageMaterials,
        showIntro: false,
        showKelengkapan: false,
        showClosing: false,
        showSignature: false,
        isFirstPage: false,
        isLastPage: false,
      });
      remainingMaterials = remainingMaterials.slice(MATERIALS_PER_MIDDLE_PAGE);
    }

    // Halaman terakhir - sisa materials + closing + signature
    if (remainingMaterials.length > 0) {
      pages.push({
        materials: remainingMaterials,
        showIntro: false,
        showKelengkapan: false,
        showClosing: true,
        showSignature: true,
        isFirstPage: false,
        isLastPage: true,
      });
    } else {
      // Jika tidak ada sisa material, tambahkan halaman baru untuk closing + signature
      pages.push({
        materials: [],
        showIntro: false,
        showKelengkapan: false,
        showClosing: true,
        showSignature: true,
        isFirstPage: false,
        isLastPage: true,
      });
    }

    return pages;
  };

  const materialPages = splitMaterialsIntoPages();

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

      // Gunakan hidden div untuk PDF generation
      const hiddenContent = document.getElementById("hidden-preview-content-berita");
      const pages = hiddenContent
        ? hiddenContent.querySelectorAll(".surat-berita-pemeriksaan")
        : document.querySelectorAll(".surat-berita-pemeriksaan");
      
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
            beritaPemeriksaan.no_berita_acara || "berita-acara-pemeriksaan"
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
  }, [isGeneratingPDF, beritaPemeriksaan.no_berita_acara]);

  const handlePrintClick = () => {
    setIsGeneratingPDF(true);
  };

  return (
    <>
      <div className="plus-jakarta-sans h-full bg-white rounded-xl w-full shadow-md py-6 px-4 max-w-full overflow-y-auto">
        {/* Header */}
        {isSend || isCanceled ? (
          <>
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {beritaPemeriksaan.perihal_kontrak}
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

            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium bg-blue-500`}
                >
                  {getCompanyAbbreviation(
                    beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      ""
                  ) || "GA"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
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
                    beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      ""
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
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
                  {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                </h2>
              </div>
            </div>
          </>
        )}

        {/* Email Content */}
        <div className="inter mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#191919]">
              {beritaPemeriksaan.no_berita_acara || "(NO Berita Acara)"}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#7F7F7F]">
              {formatDateTimeEN(
                beritaPemeriksaan.tanggal_pelaksanaan ||
                  beritaPemeriksaan.tanggal_kontrak ||
                  beritaPemeriksaan.createdAt
              )}
            </span>
          </div>
          <p className="text-[#181818] text-xs sm:text-sm md:text-base">
            {email.pesan || ""}
          </p>
        </div>

        <hr className="border-t-4 border-gray-800 mb-6" />

        {/* Document Preview */}
        <div className="mb-6 md:mb-8 w-full flex justify-center" style={{ height: "auto" }}>
          <div className="w-80 sm:w-[210mm] scale-[0.38] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 transform origin-top-left">
            <div className="bg-white py-4" style={{ width: '210mm' }}>
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
              </div>

              <hr className="border-t-2 border-gray-800 mb-4" />

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  BERITA ACARA
                </h1>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  HASIL PEMERIKSAAN MUTU BARANG
                </h1>
                <div className="text-blue-600 font-bold text-2xl">
                  {beritaPemeriksaan.no_berita_acara || "(No Berita Acara)"}
                </div>
              </div>

              {/* Introduction */}
              <div className="mb-6 text-lg text-justify">
                <p className="mb-2">
                  Pada hari{" "}
                  <span className="font-semibold">
                    {formatDateWithDay(
                      beritaPemeriksaan.tanggal_pelaksanaan ||
                        beritaPemeriksaan.tanggal_kontrak ||
                        beritaPemeriksaan.createdAt
                    )}
                  </span>{" "}
                  kami yang bertanda tangan di bawah ini telah bersama - sama
                  melaksanakan pemeriksaan terhadap barang sesuai dengan Kontrak
                  Rinci{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.no_perjanjian_kontrak || "(No Kontrak)"}
                  </span>{" "}
                  tanggal{" "}
                  <span className="font-semibold">
                    {formatDate(beritaPemeriksaan.tanggal_kontrak)}
                  </span>{" "}
                  perihal{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                  </span>
                  .
                </p>
                <p className="">
                  Sesuai dengan lembar kerja pemeriksaan dokumen tim pemeriksa
                  mutu barang. Adapun hasil dari pemeriksaan{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                  </span>{" "}
                  dapat diterima /{" "}
                  <span className="line-through">tidak diterima</span> dengan
                  kelengkapan dokumen sebagai berikut:
                </p>
              </div>

              {/* Kelengkapan Dokumen */}
              {kelengkapanDokumen.length > 0 && (
                <div className="mb-6 text-justify">
                  <ul className="space-y-1 text-lg ml-4">
                    {kelengkapanDokumen.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials Table */}
              <div className="mb-6 min-w-[300px] overflow-x-auto">
                <p className="text-lg mb-3">
                  Adapun hasil pemeriksaan sebagai berikut:
                </p>
                <table className="border-t border-b border-gray-300 text-sm w-full">
                  <thead className="bg-gray-100">
                    <tr className="text-lg text-center">
                      <th className="border-2 border-gray-800 px-2 py-2">
                        No.
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Material Description
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        QTY
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        SAT
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Serial Number
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    {beritaPemeriksaan.materials.map((item, index) => {
                      const material = item as any; // Type assertion untuk akses tipe, serial_number, lokasi
                      return (
                        <tr key={index}>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            <div className="text-left">
                              <div className="font-semibold">
                                {material.nama}
                              </div>
                              {material.katalog && (
                                <div className="">
                                  <span className="font-bold">MERK:</span>{" "}
                                  {material.katalog}
                                </div>
                              )}
                              {material.tipe && (
                                <div className="">
                                  <span className="font-bold">TYPE:</span>{" "}
                                  {material.tipe}
                                </div>
                              )}
                              {material.lokasi && (
                                <div className="">
                                  LOKASI: {material.lokasi}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.jumlah}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.satuan}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            {material.serial_number || "-"}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {material.keterangan || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Closing Statement */}
              <div className="mb-6 text-lg">
                <p>
                  Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                  dengan sesungguhnya untuk dapat dipergunakan sebagai mana
                  mestinya.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between mb-8 pr-4">
                {/* Penyedia Barang */}
                <div className="text-center items-center flex flex-col">
                  <div className="mb-2 text-lg font-semibold">
                    Penyedia Barang
                  </div>
                  <div className="font-bold mb-4 text-lg">
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-start">
                    {beritaPemeriksaan.penyedia_barang?.ttd_penerima ? (
                      <img
                        width={200}
                        height={200}
                        src={getFileUrl(
                          beritaPemeriksaan.penyedia_barang.ttd_penerima,
                          apiUrl
                        )}
                        alt="TTD Penyedia Barang"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold">
                    {beritaPemeriksaan.penyedia_barang?.nama_penanggung_jawab ||
                      "(Nama Penanggung Jawab)"}
                  </div>
                </div>

                {/* Pemeriksa Barang */}
                <div className="text-center items-center flex flex-col">
                  <div className="mb-2 text-lg font-semibold">
                    Pemeriksa Barang
                  </div>
                  <div className="font-bold mb-4 text-lg">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </div>

                  {/* List Mengetahui */}
                  {beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
                    beritaPemeriksaan.pemeriksa_barang.mengetahui.length >
                      0 && (
                      <div className="space-y-3">
                        {beritaPemeriksaan.pemeriksa_barang.mengetahui.map(
                          (mengetahui, index) => (
                            <div key={index} className="flex items-center pb-2">
                              <div className="text-base font-semibold min-w-[200px]">
                                {index + 1}{" "}
                                {mengetahui.nama_mengetahui ||
                                  "(Nama Mengetahui)"}
                              </div>
                              <div className="text-base font-semibold">:</div>
                              <div className="flex items-center ml-2">
                                <div className="w-32 h-12 flex items-center justify-center border-b-2 border-gray-800">
                                  {mengetahui.ttd_mengetahui ? (
                                    <img
                                      width={120}
                                      height={60}
                                      src={getFileUrl(
                                        mengetahui.ttd_mengetahui,
                                        apiUrl
                                      )}
                                      alt={`TTD Mengetahui ${index + 1}`}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-gray-400 text-xs">
                                      (Tanda Tangan)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ubah Surat Button for Reject Status */}
        {user?.role?.name === "Admin" &&
          beritaPemeriksaan.status_surat === "Reject" && (
            <Link
              href={`/create-letter/berita-acara-pemeriksaan-tim-mutu?mode=edit&id=${beritaPemeriksaan.documentId}`}
            >
              <Button variant="default" size="lg">
                Ubah Surat
              </Button>
            </Link>
          )}
      </div>

      {/* Hidden PDF Preview */}
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
          <div id="hidden-preview-content-berita">
            {materialPages.map((pageData, pageIndex) => {
              const {
                materials: pageMaterials,
                showIntro,
                showKelengkapan,
                showClosing,
                showSignature,
                isFirstPage,
                isLastPage,
              } = pageData;

              const isCompactModePage = pageMaterials.length <= 3;

              // Hitung index global untuk material numbering
              let startIndex = 0;
              for (let i = 0; i < pageIndex; i++) {
                startIndex += materialPages[i].materials.length;
              }

              return (
                <div
                  key={pageIndex}
                  className="surat-berita-pemeriksaan w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  style={{
                    padding: "15mm 15mm 15mm 15mm",
                    boxSizing: "border-box",
                    whiteSpace: "normal",
                    wordSpacing: "normal",
                  }}
                >
                  {/* Company Header */}
                  <div
                    className={`flex items-center gap-4 ${
                      isCompactModePage ? "mb-4" : "mb-6"
                    }`}
                  >
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
                  </div>

                  <hr
                    className={`border-t-2 border-gray-800 ${
                      isCompactModePage ? "mb-3" : "mb-4"
                    }`}
                  />

                  {/* Title - only on first page */}
                  {isFirstPage && (
                    <div className={`text-center ${isCompactModePage ? "mb-4" : "mb-6"}`}>
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-2"
                        } font-bold text-gray-900`}
                      >
                        BERITA ACARA
                      </h1>
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-2"
                        } font-bold text-gray-900`}
                      >
                        HASIL PEMERIKSAAN MUTU BARANG
                      </h1>
                      <div
                        className={`${
                          isCompactModePage ? "text-xl" : "text-2xl"
                        } text-blue-600 font-bold`}
                      >
                        {beritaPemeriksaan.no_berita_acara || "(No Berita Acara)"}
                      </div>
                    </div>
                  )}

                  {/* Introduction - only on first page */}
                  {showIntro && (
                    <div
                      className={`${isCompactModePage ? "mb-3 text-base" : "mb-4 text-lg"} text-justify`}
                    >
                      <p className="mb-2">
                        Pada hari{" "}
                        <span className="font-semibold">
                          {formatDateWithDay(
                            beritaPemeriksaan.tanggal_pelaksanaan ||
                              beritaPemeriksaan.tanggal_kontrak ||
                              beritaPemeriksaan.createdAt
                          )}
                        </span>{" "}
                        kami yang bertanda tangan di bawah ini telah bersama - sama
                        melaksanakan pemeriksaan terhadap barang sesuai dengan Kontrak
                        Rinci{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.no_perjanjian_kontrak || "(No Kontrak)"}
                        </span>{" "}
                        tanggal{" "}
                        <span className="font-semibold">
                          {formatDate(beritaPemeriksaan.tanggal_kontrak)}
                        </span>{" "}
                        perihal{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                        </span>
                        .
                      </p>
                      <p className="">
                        Sesuai dengan lembar kerja pemeriksaan dokumen tim pemeriksa
                        mutu barang. Adapun hasil dari pemeriksaan{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                        </span>{" "}
                        dapat diterima /{" "}
                        <span className="line-through">tidak diterima</span> dengan
                        kelengkapan dokumen sebagai berikut:
                      </p>
                    </div>
                  )}

                  {/* Kelengkapan Dokumen - only on first page */}
                  {showKelengkapan && kelengkapanDokumen.length > 0 && (
                    <div className={`${isCompactModePage ? "mb-3" : "mb-4"} text-justify`}>
                      <ul
                        className={`space-y-1 ${
                          isCompactModePage ? "text-base" : "text-lg"
                        } ml-4`}
                      >
                        {kelengkapanDokumen.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Materials Table */}
                  {pageMaterials.length > 0 && (
                    <div
                      className={`${
                        isCompactModePage ? "mb-3" : "mb-4"
                      } min-w-[300px] overflow-x-auto`}
                      style={{ display: "block" }}
                    >
                      <p
                        className={`${
                          isCompactModePage ? "text-base mb-1" : "text-lg mb-2"
                        }`}
                      >
                        Adapun hasil pemeriksaan sebagai berikut:
                      </p>
                      <table
                        className="border-t border-b border-gray-300 text-sm w-full"
                        style={{
                          display: "table",
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead className="bg-gray-100">
                          <tr
                            className={`${
                              isCompactModePage ? "text-base" : "text-lg"
                            } text-center`}
                          >
                            <th className="border-2 border-gray-800 px-2 py-2">No.</th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              Material Description
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">QTY</th>
                            <th className="border-2 border-gray-800 px-2 py-2">SAT</th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              Serial Number
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              Keterangan
                            </th>
                          </tr>
                        </thead>
                        <tbody className={isCompactModePage ? "text-base" : "text-lg"}>
                          {pageMaterials.map((item, index) => {
                            const material = item as any;
                            const globalIndex = startIndex + index;
                            return (
                              <tr key={globalIndex}>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {globalIndex + 1}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  }`}
                                >
                                  <div className="text-left">
                                    <div className="font-semibold">{material.nama}</div>
                                    {material.katalog && (
                                      <div className="">
                                        <span className="font-bold">MERK:</span>{" "}
                                        {material.katalog}
                                      </div>
                                    )}
                                    {material.tipe && (
                                      <div className="">
                                        <span className="font-bold">TYPE:</span>{" "}
                                        {material.tipe}
                                      </div>
                                    )}
                                    {material.lokasi && (
                                      <div className="">LOKASI: {material.lokasi}</div>
                                    )}
                                  </div>
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {item.jumlah}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {item.satuan}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } `}
                                >
                                  {material.serial_number || "-"}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {material.keterangan || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Closing Statement - only on last page */}
                  {showClosing && (
                    <div
                      className={`${isCompactModePage ? "mb-3" : "mb-4"} ${
                        isCompactModePage ? "text-base" : "text-lg"
                      }`}
                    >
                      <p>
                        Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat dengan
                        sesungguhnya untuk dapat dipergunakan sebagai mana mestinya.
                      </p>
                    </div>
                  )}

                  {/* Signatures - only on last page */}
                  {showSignature && (
                    <div
                      className={`flex justify-between ${isCompactModePage ? "mb-2" : "mb-4"}`}
                    >
                      {/* Penyedia Barang */}
                      <div className="text-center">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Penyedia Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-4"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {beritaPemeriksaan.penyedia_barang
                            ?.perusahaan_penyedia_barang ||
                            "(Perusahaan Penyedia Barang)"}
                        </div>

                        {/* Signature Preview */}
                        <div
                          className={`${
                            isCompactModePage ? "h-16 mb-2" : "h-20 mb-4"
                          } flex items-center`}
                        >
                          {beritaPemeriksaan.penyedia_barang?.ttd_penerima ? (
                            <img
                              width={200}
                              height={200}
                              src={getFileUrl(
                                beritaPemeriksaan.penyedia_barang.ttd_penerima,
                                apiUrl
                              )}
                              alt="TTD Penyedia Barang"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">(Tanda Tangan)</div>
                          )}
                        </div>

                        <div
                          className={`${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-bold `}
                        >
                          {beritaPemeriksaan.penyedia_barang?.nama_penanggung_jawab ||
                            "(Nama Penanggung Jawab)"}
                        </div>
                      </div>

                      {/* Pemeriksa Barang */}
                      <div className="text-left">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Pemeriksa Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-4"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                            "(Departemen Pemeriksa)"}
                        </div>

                        {/* List Mengetahui */}
                        {beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
                          beritaPemeriksaan.pemeriksa_barang.mengetahui.length > 0 && (
                            <div className={isCompactModePage ? "space-y-2" : "space-y-3"}>
                              {beritaPemeriksaan.pemeriksa_barang.mengetahui.map(
                                (mengetahui, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center ${
                                      isCompactModePage ? "pb-1" : "pb-2"
                                    }`}
                                  >
                                    <div
                                      className={`${
                                        isCompactModePage ? "text-sm" : "text-base"
                                      } font-semibold min-w-[200px]`}
                                    >
                                      {index + 1}{" "}
                                      {mengetahui.nama_mengetahui ||
                                        "(Nama Mengetahui)"}
                                    </div>
                                    <div
                                      className={`${
                                        isCompactModePage ? "text-sm" : "text-base"
                                      } font-semibold`}
                                    >
                                      :
                                    </div>
                                    <div className="flex items-center ml-2">
                                      <div
                                        className={`${
                                          isCompactModePage ? "w-28 h-10" : "w-32 h-12"
                                        } flex items-center justify-center border-b-2 border-gray-800`}
                                      >
                                        {mengetahui.ttd_mengetahui ? (
                                          <img
                                            width={120}
                                            height={60}
                                            src={getFileUrl(
                                              mengetahui.ttd_mengetahui,
                                              apiUrl
                                            )}
                                            alt={`TTD Mengetahui ${index + 1}`}
                                            className="max-h-full max-w-full object-contain"
                                          />
                                        ) : (
                                          <div className="text-gray-400 text-xs">
                                            (Tanda Tangan)
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
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
