"use client";

import { MouseEventHandler, useEffect, useState } from "react";
import Image from "next/image";
import {
  MoreHorizontal,
  Star,
  X,
  Reply,
  Download,
  Paperclip,
  Printer,
  ArrowUpRight,
  Eye,
  ExternalLink,
  FileText,
} from "lucide-react";
import { EmailData } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  FormData,
  MaterialForm,
  SignatureData,
} from "@/lib/surat-jalan/surat-jalan.type";
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
}: {
  email: EmailData;
  isSend?: boolean;
  isCanceled?: boolean;
  handleCloseDetail: MouseEventHandler;
}) => {
  const { user } = useUserLogin();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Convert email data to PreviewSection format
  const formData: FormData = {
    nomorSuratJalan: email.surat_jalan.no_surat_jalan,
    nomorSuratPermintaan: email.surat_jalan.no_surat_jalan, // Sesuaikan jika ada field terpisah
    perihal: email.surat_jalan.perihal,
    lokasiAsal: email.surat_jalan.lokasi_asal,
    lokasiTujuan: email.surat_jalan.lokasi_tujuan,
    informasiKendaraan: email.surat_jalan.informasi_kendaraan,
    namaPengemudi: email.surat_jalan.nama_pengemudi,
    tanggalSurat: email.surat_jalan.tanggal,
    perusahaanPenerima: email.surat_jalan.penerima.perusahaan_penerima,
    namaPenerima: email.surat_jalan.penerima.nama_penerima,
    departemenPengirim: email.surat_jalan.pengirim.departemen_pengirim,
    namaPengirim: email.surat_jalan.pengirim.nama_pengirim,
    catatanTambahan: email.surat_jalan.perihal,
    pesan: email.pesan || "", // Tambahkan field pesan yang kurang
  };

  const materials: MaterialForm[] = email.surat_jalan.materials.map(
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
  const signaturePenerima: SignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload: `${apiUrl}${email.surat_jalan.penerima.ttd_penerima?.url}`,
    },
  };

  const signaturePengirim: SignatureData = {
    upload: null,
    signature: null,
    preview: {
      signature: null,
      upload: `${apiUrl}${email.surat_jalan.pengirim.ttd_pengirim.url}`,
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
      // Wait for DOM to render
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
        });

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          // 🔹 Auto scale sebelum render
          scaleToFit(page);

          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
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

  console.log("Email Id:", email.documentId)

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
                  {email.surat_jalan.perihal}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  {!isCanceled ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                      <button onClick={handlePrintClick}>
                        <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                      </button>
                    </>
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
                    {email.surat_jalan.pengirim.departemen_pengirim}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to: {email.surat_jalan.penerima.perusahaan_penerima}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <Reply className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                <Star
                  className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ${
                    email.email_statuses.find(
                      (item) => item.user.name === user?.name
                    )?.is_bookmarked
                      ? "text-yellow-400 fill-current"
                      : "text-gray-400"
                  }`}
                />
                <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
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
                    {email.surat_jalan.pengirim.departemen_pengirim}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to: {email.surat_jalan.penerima.perusahaan_penerima}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <Reply className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                <Star
                  className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ${
                    email.email_statuses.find(
                      (item) => item.user.name === user?.name
                    )?.is_bookmarked
                      ? "text-yellow-400 fill-current"
                      : "text-gray-400"
                  }`}
                />
                <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
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
                  {email.surat_jalan.perihal}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                  <button onClick={handlePrintClick}>
                    <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Email Content */}
        <div className="inter mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#191919]">
              {email.surat_jalan.no_surat_jalan}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#7F7F7F]">
              {formatDateTimeEN(email.surat_jalan.tanggal)}
            </span>
          </div>
          <p className="text-[#181818] text-xs sm:text-sm md:text-base">
            {email.pesan}
          </p>
        </div>

        <hr className="max-md:hidden border-t-4 border-gray-800 mb-6" />

        <div className="max-md:hidden mb-6 md:mb-8">
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
                  <div className="plus-jakarta-sans text-base text-[#232323]">
                    Jl. Soekarno-Hatta No. 606 Bandung 40286
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

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  SURAT JALAN
                </h1>
                <div className="text-blue-600 font-semibold text-2xl">
                  {email.surat_jalan.no_surat_jalan}
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
                              "001.REQ/GD.UPT-BDG/IX/2025"}
                          </span>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="min-w-[180px]">Untuk Keperluan</div>
                        <div className="flex-1">
                          :{" "}
                          <span className="font-semibold">
                            {formData.perihal ||
                              "PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"}
                          </span>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="min-w-[180px]">Lokasi Asal</div>
                        <div>
                          :{" "}
                          <span className="font-semibold">
                            {formData.lokasiAsal || "GUDANG GARENTING"}
                          </span>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="min-w-[180px]">Lokasi Tujuan</div>
                        <div>
                          :{" "}
                          <span className="font-semibold">
                            {formData.lokasiTujuan || "GI BANDUNG UTARA"}
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
                  {email.surat_jalan.perihal}
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
                          :{" "}
                          {formData.informasiKendaraan ||
                            "COLT DIESEL / D 8584 HL"}
                        </div>
                      </div>
                      <div className="table-row">
                        <div className="table-cell pr-4 font-semibold">
                          Pengemudi
                        </div>
                        <div className="table-cell">
                          : {formData.namaPengemudi || "AYI"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>Bandung, {formatDate(formData.tanggalSurat)}</div>
                    </div>
                  </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-16 text-sm text-center">
                <div>
                  <div className="mb-2 text-lg">Yang Menerima,</div>
                  <div className="font-bold mb-4 text-lg">
                    {email.surat_jalan.penerima.perusahaan_penerima ||
                      "Nama Departemen"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-center">
                    {email.surat_jalan.penerima.ttd_penerima?.url ? (
                      <img
                        width={200}
                        height={200}
                        src={`http://localhost:1337${email.surat_jalan.penerima.ttd_penerima?.url}`}
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
                    {`${email.surat_jalan.penerima.nama_penerima}`}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-lg">Yang menyerahkan,</div>
                  <div className="font-bold mb-4 text-lg">
                    {email.surat_jalan.pengirim.departemen_pengirim ||
                      "Nama Departemen"}
                  </div>

                  {/* Signature Preview */}
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    {email.surat_jalan.pengirim.ttd_pengirim.url ? (
                      <>
                        <Image
                          src={`/images/ttd.png`}
                          alt="TTD"
                          width={100}
                          height={100}
                          className="absolute z-0"
                        />
                        <Image
                          width={200}
                          height={200}
                          src={`http://localhost:1337${email.surat_jalan.pengirim.ttd_pengirim.url}`}
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
                    {email.surat_jalan.pengirim.nama_pengirim}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="max-md:hidden border-b-4 border-gray-800 mb-6" />

        <div className="md:hidden w-full mb-6 md:mb-8">
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
        {email.surat_jalan.lampiran.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm md:text-base">
              <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Lampiran ({email.surat_jalan.lampiran.length})
            </h4>
            <div className="space-y-2">
              {email.surat_jalan.lampiran.map((attachment, index) => {
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
        )}
        {user?.role?.name === "Admin" && email.surat_jalan.status_surat === "Reject" && (
          <Link href={`/create-letter?mode=edit&id=${email.surat_jalan.documentId}`}>
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
            {[0, 1, 2, 3].map((index) => {
              const lembarLabels = [
                "Pengirim Barang",
                "Penerima Barang",
                "Satpam",
                formData.lokasiTujuan,
              ];
              return (
                <div
                  key={index}
                  className="bg-white surat w-[210mm] max-w-[1200px] px-8 py-4"
                >
                  {/* Company Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src="/images/PLN-logo.png"
                        alt="PLN Logo"
                        width={104}
                        height={104}
                        style={{
                          width: "104px",
                          height: "104px",
                          objectFit: "contain",
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#232323",
                          lineHeight: "1.3",
                        }}
                      >
                        PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#232323",
                          lineHeight: "1.3",
                        }}
                      >
                        UNIT PELAKSANA TRANSMISI BANDUNG
                      </div>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        backgroundColor: "rgba(166,35,68,0.1)",
                        padding: "8px 24px",
                        borderRadius: "8px",
                        border: "1px solid rgb(166,35,68)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 700,
                          color: "rgb(166,35,68)",
                        }}
                      >
                        LEMBAR {index + 1}
                      </div>
                      <div
                        style={{ fontSize: "20px", color: "rgb(166,35,68)" }}
                      >
                        {lembarLabels[index]}
                      </div>
                    </div>
                  </div>

                  <hr
                    style={{
                      borderTop: "4px solid #1f2937",
                      marginBottom: "16px",
                    }}
                  />

                  {/* Title */}
                  <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <h1
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: "8px",
                      }}
                    >
                      SURAT JALAN
                    </h1>
                    <div
                      style={{
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: "24px",
                      }}
                    >
                      {formData.nomorSuratJalan ||
                        "NO : 001.SJ/GD.UPT-BDG/IX/2025"}
                    </div>
                  </div>

                  {/* Form Information */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ marginBottom: "8px", fontSize: "18px" }}>
                      Mohon diizinkan membawa barang-barang tersebut di bawah
                      ini :
                    </div>
                    <div style={{ fontSize: "18px", lineHeight: "1.4" }}>
                      <div style={{ marginBottom: "4px" }}>
                        No Surat Permintaan :{" "}
                        <span style={{ fontWeight: 600 }}>
                          {formData.nomorSuratPermintaan ||
                            "001.REQ/GD.UPT-BDG/IX/2025"}
                        </span>
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        Untuk Keperluan :{" "}
                        <span style={{ fontWeight: 600 }}>
                          {formData.perihal ||
                            "PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"}
                        </span>
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        Lokasi Asal :{" "}
                        <span style={{ fontWeight: 600 }}>
                          {formData.lokasiAsal || "GUDANG GARENTING"}
                        </span>
                      </div>
                      <div>
                        Lokasi Tujuan :{" "}
                        <span style={{ fontWeight: 600 }}>
                          {formData.lokasiTujuan || "GI BANDUNG UTARA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Materials Table */}
                  <div style={{ marginBottom: "24px" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead style={{ backgroundColor: "#f3f4f6" }}>
                        <tr style={{ fontSize: "18px", textAlign: "center" }}>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            NO
                          </th>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            NAMA MATERIAL
                          </th>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            KATALOG
                          </th>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            SATUAN
                          </th>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            JUMLAH
                          </th>
                          <th
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          >
                            KETERANGAN (LOKASI TYPE, S/N DLL)
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "18px" }}>
                        {materials.map((material, index) => (
                          <tr key={material.id}>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {index + 1}
                            </td>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                              }}
                            >
                              {material.namaMaterial || "-"}
                            </td>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {material.katalog || "-"}
                            </td>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {material.satuan || "-"}
                            </td>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {material.jumlah || "0"}
                            </td>
                            <td
                              style={{
                                border: "2px solid #1f2937",
                                padding: "8px",
                                textAlign: "center",
                              }}
                            >
                              {material.keterangan || "-"}
                            </td>
                          </tr>
                        ))}
                        <tr
                          style={{
                            backgroundColor: "#f3f4f6",
                            fontWeight: 600,
                          }}
                        >
                          <td
                            colSpan={4}
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                              textAlign: "center",
                            }}
                          >
                            TOTAL
                          </td>
                          <td
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                              textAlign: "center",
                            }}
                          >
                            {calculateTotal()}
                          </td>
                          <td
                            style={{
                              border: "2px solid #1f2937",
                              padding: "8px",
                            }}
                          ></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  <div
                    style={{
                      paddingBottom: "12px",
                      paddingLeft: "12px",
                      borderBottom: "2px solid #1f2937",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: 600 }}>
                      Keterangan :
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      paddingLeft: "12px",
                      borderBottom: "2px solid #1f2937",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: 600 }}>
                      {formData.catatanTambahan ||
                        "PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"}
                    </div>
                  </div>

                  {/* Vehicle and Driver Info */}
                  <div
                    style={{
                      paddingLeft: "12px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "32px",
                      marginBottom: "32px",
                      fontSize: "18px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                    }}
                  >
                    <div>
                      <div>
                        <span style={{ fontWeight: 600 }}>Kendaraan</span> :{" "}
                        {formData.informasiKendaraan ||
                          "COLT DIESEL / D 8584 HL"}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>Pengemudi</span> :{" "}
                        {formData.namaPengemudi || "AYI"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>
                        Bandung, {formatDateTimeEN(formData.tanggalSurat)}
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "64px",
                      textAlign: "center",
                    }}
                  >
                    {/* Penerima */}
                    <div>
                      <div style={{ marginBottom: "8px", fontSize: "18px" }}>
                        Yang Menerima,
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: "16px",
                          fontSize: "18px",
                        }}
                      >
                        {formData.perusahaanPenerima || "GI BANDUNG UTARA"}
                      </div>
                      <div
                        style={{
                          height: "96px",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {signaturePenerima.preview.upload ? (
                          <img
                            src={signaturePenerima.preview.upload}
                            alt="Signature Penerima"
                            style={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                            }}
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">
                            (Tanda Tangan)
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 700 }}>
                        {formData.namaPenerima || "PAK RUDI"}
                      </div>
                    </div>

                    {/* Pengirim */}
                    <div style={{ position: "relative" }}>
                      <div style={{ marginBottom: "8px", fontSize: "18px" }}>
                        Yang Menyerahkan,
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: "16px",
                          fontSize: "18px",
                        }}
                      >
                        {formData.departemenPengirim || "LOGISTIK UPT BANDUNG"}
                      </div>
                      <img
                        src="/images/ttd.png"
                        alt="TTD"
                        width={140}
                        height={140}
                        style={{
                          position: "absolute",
                          zIndex: 0,
                          left: "80px",
                          bottom: "24px",
                          width: "140px",
                          height: "140px",
                        }}
                        crossOrigin="anonymous"
                      />
                      <div
                        style={{
                          height: "96px",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          zIndex: 20,
                        }}
                      >
                        {signaturePengirim.preview.upload && (
                          <img
                            src={signaturePengirim.preview.upload}
                            alt="Signature Pengirim"
                            style={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                            }}
                            crossOrigin="anonymous"
                          />
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "18px" }}>
                        {formData.namaPengirim || "ANDRI SETIAWAN"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
