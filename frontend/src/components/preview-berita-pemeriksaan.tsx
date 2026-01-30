"use client";

import { Send, StickyNote, Download, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FormData,
  MaterialForm,
  SignatureData,
  MengetahuiForm,
} from "@/lib/surat-pemeriksaan/berita-pemeriksaan.type";
import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface PreviewSectionProps {
  formData: FormData;
  materials: MaterialForm[];
  signaturePenyediaBarang: SignatureData;
  pemeriksaBarang: {
    departemenPemeriksa: string;
    mengetahui: MengetahuiForm[];
  };
  onClose: () => void;
  onSubmit: () => void;
  onDraft: () => void;
  onDownloadPDF: () => void;
  calculateTotal: () => number;
  autoDownload?: boolean;
  lampiran?: File[]; // Tambahkan prop lampiran
}

const parseKelengkapanFromMarkdown = (markdown: string): string[] => {
  if (!markdown) return [];
  return markdown
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.trim());
};

export default function PreviewBeritaPemeriksaan({
  formData,
  materials,
  signaturePenyediaBarang,
  pemeriksaBarang,
  onClose,
  onSubmit,
  onDraft,
  onDownloadPDF,
  calculateTotal,
  autoDownload = false,
  lampiran = [], // Default empty array
}: PreviewSectionProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        onDownloadPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, onDownloadPDF]);

  const getPenyediaBarangSignature = () => {
    return (
      signaturePenyediaBarang.preview.signature ||
      signaturePenyediaBarang.preview.upload ||
      null
    );
  };

  const getMengetahuiSignature = (mengetahui: MengetahuiForm) => {
    return (
      mengetahui.signature.preview.signature ||
      mengetahui.signature.preview.upload ||
      null
    );
  };

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
    const date = new Date(dateString);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    return `${days[date.getDay()]}, ${formatDate(dateString)}`;
  };

  const kelengkapanDokumen = parseKelengkapanFromMarkdown(
    formData.kelengkapanDokumen,
  );

  const hasMaterialData = () => {
    return materials.some(
      (m) =>
        m.namaMaterial ||
        m.katalog ||
        m.satuan ||
        m.jumlah ||
        m.tipe ||
        m.serial_number ||
        m.lokasi,
    );
  };

  // Fungsi untuk mendapatkan lampiran gambar
  const getImageLampiran = () => {
    return lampiran && Array.isArray(lampiran)
      ? lampiran.filter(
          (file) =>
            file &&
            file.type &&
            typeof file.type === "string" &&
            file.type.startsWith("image/"),
        )
      : [];
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

    let toastId: string | number;

    const generatePDF = async () => {
      toastId = toast.loading("Generating PDF...", {
        position: "top-center",
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Gunakan hidden div untuk PDF generation (tidak terpengaruh responsive scale)
      const hiddenContent = document.getElementById("hidden-preview-content");
      const pages = hiddenContent
        ? hiddenContent.querySelectorAll(".surat-berita-pemeriksaan")
        : document.querySelectorAll(".surat-berita-pemeriksaan");

      if (!pages.length) {
        console.error("Preview element tidak ditemukan!");
        toast.dismiss(toastId);
        toast.error("Gagal generate PDF. Preview element tidak ditemukan!", {
          position: "top-center",
        });
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

        // Deteksi mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          // Reset transform sebelum capture
          page.style.transform = "";
          page.style.transformOrigin = "";

          const canvas = await html2canvas(page, {
            scale: isMobile ? 3 : 2, // Scale lebih tinggi untuk mobile
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            imageTimeout: 0,
            windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
            windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
            width: 794,
            height: 1123,
            scrollX: 0,
            scrollY: 0,
          });

          const imgData = canvas.toDataURL("image/png");
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
        }

        pdf.save(
          `${formData.nomorBeritaAcara || "berita-acara-pemeriksaan"}.pdf`,
        );

        toast.dismiss(toastId);
        toast.success("PDF generated successfully!", {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.dismiss(toastId);
        toast.error("Gagal generate PDF. Silakan coba lagi.", {
          position: "top-center",
        });
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    generatePDF();
  }, [isGeneratingPDF, formData.nomorBeritaAcara]);

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
  };

  const splitMaterialsIntoPages = () => {
    const totalMaterials = materials.length;
    const kelengkapanCount = kelengkapanDokumen.length;

    // Check if there are image lampiran
    const imageLampiran = getImageLampiran();
    const hasImageLampiran = imageLampiran.length > 0;

    // Logika baru:
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
    // Tapi jangan tampilkan lampiran di halaman yang sama (akan di halaman terpisah)
    if (!shouldBreakPage) {
      return [
        {
          materials: materials,
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
    let remainingMaterials = [...materials];

    // Tentukan berapa material di halaman pertama
    let materialsFirstPage = 2;
    if (kelengkapanCount <= 2) {
      materialsFirstPage = 3; // Lebih banyak material jika kelengkapan sedikit
    } else if (kelengkapanCount <= 5) {
      materialsFirstPage = 2;
    } else if (kelengkapanCount <= 10) {
      materialsFirstPage = 2; // Kelengkapan banyak, material sedikit di halaman 1
    } else {
      materialsFirstPage = 1; // Kelengkapan sangat banyak (> 10), hanya 1 material di halaman 1
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
      const nextPageMaterials = remainingMaterials.slice(
        0,
        MATERIALS_PER_MIDDLE_PAGE,
      );
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

    // Halaman terakhir - sisa materials + closing + signature (tanpa lampiran)
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
      // Jika tidak ada sisa material, footer di halaman kosong
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

  // Fungsi helper untuk menghitung lebar maksimum berdasarkan nama terpanjang
  const calculateMaxNamaWidth = (isCompact: boolean) => {
    if (
      !pemeriksaBarang.mengetahui ||
      pemeriksaBarang.mengetahui.length === 0
    ) {
      return 200; // Default width
    }

    // Cari nama terpanjang
    const maxLength = Math.max(
      ...pemeriksaBarang.mengetahui.map(
        (m) => (m.namaMengetahui || "(Nama Mengetahui)").length,
      ),
    );

    // Estimasi lebar: setiap karakter ~8-10px untuk font-size base, tambahkan padding
    // Untuk text-sm: ~7px per karakter, untuk text-base: ~8-9px per karakter
    const charWidth = isCompact ? 7 : 8.5;
    const estimatedWidth = maxLength * charWidth + 40; // +40 untuk nomor dan padding

    // Gunakan minWidth 120px dan maxWidth 300px untuk batasan yang wajar
    return Math.max(120, Math.min(300, estimatedWidth));
  };

  // Render halaman lampiran terpisah
  const renderLampiranPage = () => {
    const imageLampiran = getImageLampiran();
    if (imageLampiran.length === 0) return null;

    return (
      <div
        key="lampiran-page"
        className="surat-berita-pemeriksaan bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
        style={{
          width: "794px",
          minHeight: "1123px",
          padding: "40px 56.7px 30px 56.7px",
          boxSizing: "border-box",
          whiteSpace: "normal",
          wordSpacing: "normal",
        }}
      >
        {/* Company Header */}
        <div className="flex items-center gap-4 mb-3">
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

        <hr className="border-t-2 border-gray-800 mb-2" />

        {/* Grid Lampiran - 3 kolom untuk banyak foto */}
        <div
          className="grid grid-cols-3 gap-4"
          style={{ maxHeight: "calc(100% - 200px)" }}
        >
          {imageLampiran.map((file, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-start"
            >
              <div className="w-full aspect-square flex items-center justify-center overflow-hidden mb-2">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Lampiran ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Loading Overlay */}
      <div className=" bg-[#F6F9FF] p-4 sm:p-6 lg:p-9">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="plus-jakarta-sans text-lg sm:text-xl md:text-2xl font-semibold text-[#353739]">
              Preview Berita Acara Pemeriksaan Tim Mutu
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Tutup</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
              <Button
                variant="outline"
                onClick={onDraft}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <StickyNote className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Draft</span>
              </Button>
              <Button
                onClick={onSubmit}
                className="flex items-center gap-1 sm:gap-2 bg-[#0056B0] text-white hover:bg-[#004494] text-xs sm:text-sm"
                size="sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="space-y-6 w-full flex justify-center">
            <div className="w-80 sm:w-[210mm] scale-[0.38] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 transform origin-top-left">
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

                const isCompactMode = pageMaterials.length <= 3;

                // Hitung lebar maksimum untuk container nama mengetahui berdasarkan nama terpanjang
                const maxNamaWidthPage = calculateMaxNamaWidth(isCompactMode);

                // Hitung index global untuk material numbering
                let startIndex = 0;
                for (let i = 0; i < pageIndex; i++) {
                  startIndex += materialPages[i].materials.length;
                }

                return (
                  <div
                    key={pageIndex}
                    className="surat bg-white border border-gray-300 p-6 sm:p-8 mb-8"
                    data-lembar={pageIndex + 1}
                    data-page={pageIndex + 1}
                    style={{
                      width: "210mm",
                      minHeight: "297mm",
                      margin: "10 auto",
                    }}
                  >
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
                          PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN
                          TENGAH
                        </div>
                        <div className="plus-jakarta-sans text-base font-semibold text-[#232323]">
                          UNIT PELAKSANA TRANSMISI BANDUNG
                        </div>
                      </div>
                    </div>

                    <hr className="border-t-2 border-gray-800 mb-4" />

                    {/* Title - only on first page */}
                    {isFirstPage && (
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          BERITA ACARA
                        </h1>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          HASIL PEMERIKSAAN MUTU BARANG
                        </h1>
                        <div className="text-blue-600 font-bold text-2xl">
                          {formData.nomorBeritaAcara || "(No Berita Acara)"}
                        </div>
                      </div>
                    )}

                    {/* Introduction - only on first page */}
                    {showIntro && (
                      <div
                        className={`mb-6 ${
                          isCompactMode ? "text-base" : "text-lg"
                        } text-justify`}
                      >
                        <p className="mb-2">
                          Pada hari{" "}
                          <span className="font-semibold">
                            {formatDateWithDay(
                              formData.tanggalPelaksanaan ||
                                formData.tanggalKontrak ||
                                new Date().toISOString(),
                            )}
                          </span>{" "}
                          kami yang bertanda tangan di bawah ini telah bersama -
                          sama melaksanakan pemeriksaan terhadap barang sesuai
                          dengan Kontrak Rinci{" "}
                          <span className="font-semibold">
                            {formData.nomorPerjanjianKontrak || "(No Kontrak)"}
                          </span>{" "}
                          tanggal{" "}
                          <span className="font-semibold">
                            {formatDate(formData.tanggalKontrak)}
                          </span>{" "}
                          perihal{" "}
                          <span className="font-semibold">
                            {formData.perihalKontrak || "(Perihal Kontrak)"}
                          </span>
                          .
                        </p>
                        <p className="">
                          Sesuai dengan lembar kerja pemeriksaan dokumen tim
                          pemeriksa mutu barang. Adapun hasil dari pemeriksaan{" "}
                          <span className="font-semibold">
                            {formData.perihalKontrak || "(Perihal Kontrak)"}
                          </span>{" "}
                          dapat diterima /{" "}
                          <span className="line-through">tidak diterima</span>{" "}
                          dengan kelengkapan dokumen sebagai berikut:
                        </p>
                      </div>
                    )}

                    {/* Kelengkapan Dokumen - only on first page */}
                    {showKelengkapan && kelengkapanDokumen.length > 0 && (
                      <div
                        className={`mb-6 ${
                          isCompactMode ? "text-base" : "text-lg"
                        }`}
                      >
                        <ul className="space-y-1 ml-4">
                          {kelengkapanDokumen.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Materials Table */}
                    {pageMaterials.length > 0 && (
                      <div
                        className={`mb-6 min-w-[300px] overflow-x-auto ${
                          isCompactMode ? "text-sm" : "text-base"
                        }`}
                      >
                        <p
                          className={`mb-3 ${
                            isCompactMode ? "text-base" : "text-lg"
                          }`}
                        >
                          Adapun hasil pemeriksaan sebagai berikut:
                        </p>
                        <table className="border-t border-b border-gray-300 w-full">
                          <thead className="bg-gray-100">
                            <tr
                              className={`text-center ${
                                isCompactMode ? "text-base" : "text-lg"
                              }`}
                            >
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
                            </tr>
                          </thead>
                          <tbody
                            className={isCompactMode ? "text-base" : "text-lg"}
                          >
                            {pageMaterials.map((material, index) => {
                              const globalIndex = startIndex + index;
                              return (
                                <tr key={material.id}>
                                  <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                    {globalIndex + 1}
                                  </td>
                                  <td className="border-2 border-gray-800 px-2 py-2">
                                    <div className="text-left">
                                      <div className="font-semibold">
                                        {material.namaMaterial || "-"}
                                      </div>
                                      {material.katalog && (
                                        <div className="">
                                          <span className="font-bold">
                                            MERK:
                                          </span>{" "}
                                          {material.katalog}
                                        </div>
                                      )}
                                      {material.tipe && (
                                        <div className="">
                                          <span className="font-bold">
                                            TYPE:
                                          </span>{" "}
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
                                    {material.jumlah || "0"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                    {material.satuan || "-"}
                                  </td>
                                  <td className="border-2 border-gray-800 px-2 py-2 ">
                                    {material.serial_number || "-"}
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
                        className={`mb-6 ${
                          isCompactMode ? "text-base" : "text-lg"
                        }`}
                      >
                        <p>
                          Demikian Berita Acara Pemeriksaan Mutu Barang ini
                          dibuat dengan sesungguhnya untuk dapat dipergunakan
                          sebagai mana mestinya.
                        </p>
                      </div>
                    )}

                    {/* Signatures - only on last page */}
                    {showSignature && (
                      <div className="flex justify-between mb-8">
                        {/* Penyedia Barang */}
                        <div className="text-left items-center flex flex-col">
                          <div
                            className={`mb-2 font-semibold ${
                              isCompactMode ? "text-base" : "text-lg"
                            }`}
                          >
                            Penyedia Barang
                          </div>
                          <div
                            className={`font-bold mb-4 ${
                              isCompactMode ? "text-base" : "text-lg"
                            }`}
                          >
                            {formData.perusahaanPenyediaBarang ||
                              "(Perusahaan Penyedia Barang)"}
                          </div>

                          {/* Signature Preview */}
                          <div
                            className={`${
                              isCompactMode ? "h-16 mb-4" : "h-20 mb-4"
                            } flex items-center`}
                          >
                            {getPenyediaBarangSignature() ? (
                              <img
                                width={200}
                                height={200}
                                src={getPenyediaBarangSignature()!}
                                alt="TTD Penyedia Barang"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 text-sm">
                                (Tanda Tangan)
                              </div>
                            )}
                          </div>

                          <div
                            className={`font-bold  ${
                              isCompactMode ? "text-base" : "text-lg"
                            }`}
                          >
                            {formData.namaPenanggungJawab ||
                              "(Nama Penanggung Jawab)"}
                          </div>
                        </div>

                        {/* Pemeriksa Barang */}
                        <div className="text-left items-center flex flex-col">
                          <div
                            className={`mb-2 font-semibold ${
                              isCompactMode ? "text-base" : "text-lg"
                            }`}
                          >
                            Pemeriksa Barang
                          </div>
                          <div
                            className={`font-bold mb-4 ${
                              isCompactMode ? "text-base" : "text-lg"
                            }`}
                          >
                            {pemeriksaBarang.departemenPemeriksa ||
                              "(Departemen Pemeriksa)"}
                          </div>

                          {/* List Mengetahui */}
                          {pemeriksaBarang.mengetahui &&
                            pemeriksaBarang.mengetahui.length > 0 && (
                              <div
                                className={
                                  isCompactMode ? "space-y-2" : "space-y-3"
                                }
                              >
                                {pemeriksaBarang.mengetahui.map(
                                  (mengetahui, index) => (
                                    <div
                                      key={mengetahui.id}
                                      className={`flex items-center ${
                                        isCompactMode ? "pb-1" : "pb-2"
                                      }`}
                                    >
                                      <div
                                        className={`${
                                          isCompactMode
                                            ? "text-sm"
                                            : "text-base"
                                        } font-semibold flex items-center`}
                                        style={{
                                          width: `${maxNamaWidthPage}px`,
                                        }}
                                      >
                                        <span className="mr-2">
                                          {index + 1}
                                        </span>
                                        <span className="flex-1">
                                          {mengetahui.namaMengetahui ||
                                            "(Nama Mengetahui)"}
                                        </span>
                                        <span className="ml-auto">:</span>
                                      </div>
                                      <div className="flex items-center ml-2">
                                        <div
                                          className={`${
                                            isCompactMode
                                              ? "w-28 h-10"
                                              : "w-32 h-12"
                                          } flex items-center justify-center border-b-2 border-gray-800`}
                                        >
                                          {getMengetahuiSignature(
                                            mengetahui,
                                          ) ? (
                                            <img
                                              width={120}
                                              height={60}
                                              src={
                                                getMengetahuiSignature(
                                                  mengetahui,
                                                )!
                                              }
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
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Halaman Lampiran Terpisah - hanya tampil jika ada lampiran */}
              {getImageLampiran().length > 0 && (
                <div
                  className="surat bg-white border border-gray-300 p-6 sm:p-8 mb-8"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    margin: "10 auto",
                  }}
                >
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

                  {/* Grid Lampiran */}
                  <div className="grid grid-cols-3 gap-4">
                    {getImageLampiran().map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center justify-start"
                      >
                        <div className="w-full aspect-square flex items-center justify-center overflow-hidden mb-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Lampiran ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden PDF Preview - selalu ada untuk PDF generation */}
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            backgroundColor: "#ffffff",
            zIndex: -1,
            width: "794px", // A4 width in pixels
          }}
        >
          <div id="hidden-preview-content" style={{ width: "794px" }}>
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
                  className="surat-berita-pemeriksaan bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  style={{
                    width: "794px",
                    minHeight: "1123px",
                    padding: "40px 56.7px 30px 56.7px", // Top, Right, Bottom, Left - Kurangi padding bottom
                    boxSizing: "border-box",
                    whiteSpace: "normal",
                    wordSpacing: "normal",
                  }}
                >
                  {/* Company Header */}
                  <div
                    className={`flex items-center gap-4 ${
                      isCompactModePage ? "mb-3" : "mb-5"
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
                      isCompactModePage ? "mb-2" : "mb-3"
                    }`}
                  />

                  {/* Title - only on first page */}
                  {isFirstPage && (
                    <div
                      className={`text-center ${isCompactModePage ? "mb-3" : "mb-5"}`}
                    >
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-1"
                        } font-bold text-gray-900`}
                      >
                        BERITA ACARA
                      </h1>
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-1"
                        } font-bold text-gray-900`}
                      >
                        HASIL PEMERIKSAAN MUTU BARANG
                      </h1>
                      <div
                        className={`${
                          isCompactModePage ? "text-xl" : "text-2xl"
                        } text-blue-600 font-bold`}
                      >
                        {formData.nomorBeritaAcara || "(No Berita Acara)"}
                      </div>
                    </div>
                  )}

                  {/* Introduction - only on first page */}
                  {showIntro && (
                    <div
                      className={`${isCompactModePage ? "mb-2 text-base" : "mb-3 text-lg"} text-justify`}
                    >
                      <p className="mb-2">
                        Pada hari{" "}
                        <span className="font-semibold">
                          {formatDateWithDay(
                            formData.tanggalPelaksanaan ||
                              formData.tanggalKontrak ||
                              new Date().toISOString(),
                          )}
                        </span>{" "}
                        kami yang bertanda tangan di bawah ini telah bersama -
                        sama melaksanakan pemeriksaan terhadap barang sesuai
                        dengan Kontrak Rinci{" "}
                        <span className="font-semibold">
                          {formData.nomorPerjanjianKontrak || "(No Kontrak)"}
                        </span>{" "}
                        tanggal{" "}
                        <span className="font-semibold">
                          {formatDate(formData.tanggalKontrak)}
                        </span>{" "}
                        perihal{" "}
                        <span className="font-semibold">
                          {formData.perihalKontrak || "(Perihal Kontrak)"}
                        </span>
                        .
                      </p>
                      <p className="">
                        Sesuai dengan lembar kerja pemeriksaan dokumen tim
                        pemeriksa mutu barang. Adapun hasil dari pemeriksaan{" "}
                        <span className="font-semibold">
                          {formData.perihalKontrak || "(Perihal Kontrak)"}
                        </span>{" "}
                        dapat diterima /{" "}
                        <span className="line-through">tidak diterima</span>{" "}
                        dengan kelengkapan dokumen sebagai berikut:
                      </p>
                    </div>
                  )}

                  {/* Kelengkapan Dokumen - only on first page */}
                  {showKelengkapan && kelengkapanDokumen.length > 0 && (
                    <div
                      className={`${isCompactModePage ? "mb-2" : "mb-3"} text-justify`}
                    >
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
                        isCompactModePage ? "mb-2" : "mb-3"
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
                          </tr>
                        </thead>
                        <tbody
                          className={
                            isCompactModePage ? "text-base" : "text-lg"
                          }
                        >
                          {pageMaterials.map((material, index) => {
                            const globalIndex = startIndex + index;
                            return (
                              <tr key={material.id}>
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
                                    <div className="font-semibold">
                                      {material.namaMaterial || "-"}
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
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {material.jumlah || "0"}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {material.satuan || "-"}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } `}
                                >
                                  {material.serial_number || "-"}
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
                      className={`${isCompactModePage ? "mb-2" : "mb-3"} ${
                        isCompactModePage ? "text-base" : "text-lg"
                      }`}
                    >
                      <p>
                        Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                        dengan sesungguhnya untuk dapat dipergunakan sebagai
                        mana mestinya.
                      </p>
                    </div>
                  )}

                  {/* Signatures - only on last page */}
                  {showSignature && (
                    <div
                      className={`flex justify-between ${isCompactModePage ? "mb-2" : "mb-3"}`}
                    >
                      {/* Penyedia Barang */}
                      <div className="text-center items-center flex flex-col">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Penyedia Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-3"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {formData.perusahaanPenyediaBarang ||
                            "(Perusahaan Penyedia Barang)"}
                        </div>

                        {/* Signature Preview */}
                        <div
                          className={`${
                            isCompactModePage ? "h-14 mb-2" : "h-16 mb-3"
                          } flex items-center justify-start`}
                        >
                          {getPenyediaBarangSignature() ? (
                            <img
                              width={200}
                              height={200}
                              src={getPenyediaBarangSignature()!}
                              alt="TTD Penyedia Barang"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">
                              (Tanda Tangan)
                            </div>
                          )}
                        </div>

                        <div
                          className={`${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-bold`}
                        >
                          {formData.namaPenanggungJawab ||
                            "(Nama Penanggung Jawab)"}
                        </div>
                      </div>

                      {/* Pemeriksa Barang */}
                      <div className="text-center items-center flex flex-col">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Pemeriksa Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-3"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {pemeriksaBarang.departemenPemeriksa ||
                            "(Departemen Pemeriksa)"}
                        </div>

                        {/* List Mengetahui */}
                        {pemeriksaBarang.mengetahui &&
                          pemeriksaBarang.mengetahui.length > 0 && (
                            <div
                              className={
                                isCompactModePage ? "space-y-1" : "space-y-2"
                              }
                            >
                              {pemeriksaBarang.mengetahui.map(
                                (mengetahui, index) => (
                                  <div
                                    key={mengetahui.id}
                                    className={`flex items-center ${
                                      isCompactModePage ? "pb-1" : "pb-1"
                                    }`}
                                  >
                                    <div
                                      className={`${
                                        isCompactModePage
                                          ? "text-sm"
                                          : "text-base"
                                      } font-semibold min-w-[200px]`}
                                    >
                                      {index + 1}{" "}
                                      {mengetahui.namaMengetahui ||
                                        "(Nama Mengetahui)"}
                                    </div>
                                    <div
                                      className={`${
                                        isCompactModePage
                                          ? "text-sm"
                                          : "text-base"
                                      } font-semibold`}
                                    >
                                      :
                                    </div>
                                    <div className="flex items-center ml-2">
                                      <div
                                        className={`${
                                          isCompactModePage
                                            ? "w-24 h-9"
                                            : "w-28 h-10"
                                        } flex items-center justify-center border-b-2 border-gray-800`}
                                      >
                                        {getMengetahuiSignature(mengetahui) ? (
                                          <img
                                            width={120}
                                            height={60}
                                            src={
                                              getMengetahuiSignature(
                                                mengetahui,
                                              )!
                                            }
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
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Halaman Lampiran - untuk PDF generation */}
            {renderLampiranPage()}
          </div>
        </div>
      </div>
    </>
  );
}
