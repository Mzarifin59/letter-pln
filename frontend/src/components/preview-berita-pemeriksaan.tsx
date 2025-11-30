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
import { useEffect, useMemo } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

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
}: PreviewSectionProps) {
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
    formData.kelengkapanDokumen
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
        m.lokasi
    );
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

  const handleDownloadPDF = async () => {
    const pages = document.querySelectorAll(".surat");
    if (!pages.length) return alert("Preview tidak ditemukan!");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    let isFirstPage = true;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      // Render canvas dengan scale optimal
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: page.scrollWidth,
        windowHeight: page.scrollHeight,
        width: page.scrollWidth,
        height: page.scrollHeight,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedPage = clonedDoc.querySelector(
            `[data-lembar="${page.getAttribute(
              "data-lembar"
            )}"][data-page="${page.getAttribute("data-page")}"]`
          ) as HTMLElement;
          if (clonedPage) {
            clonedPage.style.height = "297mm";
            clonedPage.style.maxHeight = "297mm";
            clonedPage.style.overflow = "hidden";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add new page jika bukan halaman pertama
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Tambahkan image dengan ukuran exact A4
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );
    }

    pdf.save(`${formData.nomorBeritaAcara || "berita-acara-pemeriksaan"}.pdf`);
  };

  const splitMaterialsIntoPages = () => {
    const itemsPerPage = 3;
    const pages: MaterialForm[][] = [];

    for (let i = 0; i < materials.length; i += itemsPerPage) {
      pages.push(materials.slice(i, i + itemsPerPage));
    }

    return pages.length > 0 ? pages : [[]];
  };

  const materialPages = splitMaterialsIntoPages();

  // Fungsi helper untuk menghitung lebar maksimum berdasarkan nama terpanjang
  const calculateMaxNamaWidth = (isCompact: boolean) => {
    if (!pemeriksaBarang.mengetahui || pemeriksaBarang.mengetahui.length === 0) {
      return 200; // Default width
    }

    // Cari nama terpanjang
    const maxLength = Math.max(
      ...pemeriksaBarang.mengetahui.map(
        (m) => (m.namaMengetahui || "(Nama Mengetahui)").length
      )
    );

    // Estimasi lebar: setiap karakter ~8-10px untuk font-size base, tambahkan padding
    // Untuk text-sm: ~7px per karakter, untuk text-base: ~8-9px per karakter
    const charWidth = isCompact ? 7 : 8.5;
    const estimatedWidth = maxLength * charWidth + 40; // +40 untuk nomor dan padding

    // Gunakan minWidth 120px dan maxWidth 300px untuk batasan yang wajar
    return Math.max(120, Math.min(300, estimatedWidth));
  };

  return (
    <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="plus-jakarta-sans text-xl sm:text-2xl font-semibold text-[#353739]">
            Preview Berita Acara Pemeriksaan Tim Mutu
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Tutup
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={onDraft}
              className="flex items-center gap-2"
            >
              <StickyNote className="w-4 h-4" />
              Draft
            </Button>
            <Button
              onClick={onSubmit}
              className="flex items-center gap-2 bg-[#0056B0] text-white hover:bg-[#004494]"
            >
              <Send className="w-4 h-4" />
              Kirim
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="space-y-6">
          {materialPages.map((pageMaterials, pageIndex) => {
            const isCompactMode = pageMaterials.length <= 3;
            const lembarLabels = materialPages.length > 1
              ? [`Lembar ${pageIndex + 1}`, `Lembar ${pageIndex + 1}`]
              : ["Lembar 1", "Lembar 1"];

            // Hitung lebar maksimum untuk container nama mengetahui berdasarkan nama terpanjang
            const maxNamaWidthPage = calculateMaxNamaWidth(isCompactMode);

            return (
              <div
                key={pageIndex}
                className="surat bg-white border border-gray-300 p-6 sm:p-8"
                data-lembar={pageIndex + 1}
                data-page={pageIndex + 1}
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  margin: "0 auto",
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

                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    BERITA ACARA
                  </h1>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    HASIL PEMERIKSAAN MUTU BARANG
                  </h1>
                  <div className="text-blue-600 font-semibold text-2xl">
                    {formData.nomorBeritaAcara || "(No Berita Acara)"}
                  </div>
                </div>

                {/* Introduction */}
                <div className={`mb-6 ${isCompactMode ? "text-base" : "text-lg"}`}>
                  <p className="mb-2">
                    Pada hari{" "}
                    <span className="font-semibold">
                      {formatDateWithDay(
                        formData.tanggalPelaksanaan ||
                          formData.tanggalKontrak ||
                          new Date().toISOString()
                      )}
                    </span>{" "}
                    kami yang bertanda tangan di bawah ini telah bersama - sama
                    melaksanakan pemeriksaan terhadap barang sesuai dengan Kontrak
                    Rinci{" "}
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
                    Sesuai dengan lembar kerja pemeriksaan dokumen tim pemeriksa
                    mutu barang. Adapun hasil dari pemeriksaan{" "}
                    <span className="font-semibold">
                      {formData.perihalKontrak || "(Perihal Kontrak)"}
                    </span>{" "}
                    dapat diterima /{" "}
                    <span className="line-through">tidak diterima</span> dengan
                    kelengkapan dokumen sebagai berikut:
                  </p>
                </div>

                {/* Kelengkapan Dokumen */}
                {kelengkapanDokumen.length > 0 && (
                  <div className={`mb-6 ${isCompactMode ? "text-base" : "text-lg"}`}>
                    <ul className="space-y-1 ml-4">
                      {kelengkapanDokumen.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials Table */}
                {pageMaterials.length > 0 && (
                  <div className={`mb-6 min-w-[300px] overflow-x-auto ${isCompactMode ? "text-sm" : "text-base"}`}>
                    <p className={`mb-3 ${isCompactMode ? "text-base" : "text-lg"}`}>
                      Adapun hasil pemeriksaan sebagai berikut:
                    </p>
                    <table className="border-t border-b border-gray-300 w-full">
                      <thead className="bg-gray-100">
                        <tr className={`text-center ${isCompactMode ? "text-base" : "text-lg"}`}>
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
                      <tbody className={isCompactMode ? "text-base" : "text-lg"}>
                        {pageMaterials.map((material, index) => {
                          const globalIndex =
                            pageIndex * 3 + index;
                          return (
                            <tr key={material.id}>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {globalIndex + 1}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2">
                                <div className="text-center">
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
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.jumlah || "0"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.satuan || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-red-400">
                                {material.serial_number || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Closing Statement */}
                {pageIndex === materialPages.length - 1 && (
                  <>
                    <div className={`mb-6 ${isCompactMode ? "text-base" : "text-lg"}`}>
                      <p>
                        Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                        dengan sesungguhnya untuk dapat dipergunakan sebagai mana
                        mestinya.
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="flex gap-4 mb-8">
                      {/* Penyedia Barang */}
                      <div className="text-left items-center flex flex-col">
                        <div className={`mb-2 font-semibold ${isCompactMode ? "text-base" : "text-lg"}`}>
                          Penyedia Barang
                        </div>
                        <div className={`font-bold mb-4 ${isCompactMode ? "text-base" : "text-lg"}`}>
                          {formData.perusahaanPenyediaBarang ||
                            "(Perusahaan Penyedia Barang)"}
                        </div>

                        {/* Signature Preview */}
                        <div className={`${isCompactMode ? "h-16 mb-4" : "h-20 mb-4"} flex items-center`}>
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

                        <div className={`font-bold text-red-500 ${isCompactMode ? "text-base" : "text-lg"}`}>
                          {formData.namaPenanggungJawab ||
                            "(Nama Penanggung Jawab)"}
                        </div>
                      </div>

                      {/* Pemeriksa Barang */}
                      <div className="text-left items-center flex flex-col">
                        <div className={`mb-2 font-semibold ${isCompactMode ? "text-base" : "text-lg"}`}>
                          Pemeriksa Barang
                        </div>
                        <div className={`font-bold mb-4 ${isCompactMode ? "text-base" : "text-lg"}`}>
                          {pemeriksaBarang.departemenPemeriksa ||
                            "(Departemen Pemeriksa)"}
                        </div>

                        {/* List Mengetahui */}
                        {pemeriksaBarang.mengetahui &&
                          pemeriksaBarang.mengetahui.length > 0 && (
                            <div className={isCompactMode ? "space-y-2" : "space-y-3"}>
                              {pemeriksaBarang.mengetahui.map(
                                (mengetahui, index) => (
                                  <div
                                    key={mengetahui.id}
                                    className={`flex items-center ${isCompactMode ? "pb-1" : "pb-2"}`}
                                  >
                                    <div
                                      className={`${isCompactMode ? "text-sm" : "text-base"} font-semibold flex items-center`}
                                      style={{ width: `${maxNamaWidthPage}px` }}
                                    >
                                      <span className="mr-2">{index + 1}</span>
                                      <span className="flex-1">
                                        {mengetahui.namaMengetahui ||
                                          "(Nama Mengetahui)"}
                                      </span>
                                      <span className="ml-auto">:</span>
                                    </div>
                                    <div className="flex items-center ml-2">
                                      <div
                                        className={`${isCompactMode ? "w-28 h-10" : "w-32 h-12"} flex items-center justify-center border-b-2 border-gray-800`}
                                      >
                                        {getMengetahuiSignature(mengetahui) ? (
                                          <img
                                            width={120}
                                            height={60}
                                            src={getMengetahuiSignature(mengetahui)!}
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

