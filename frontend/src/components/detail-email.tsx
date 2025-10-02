"use client";

import { JSX, MouseEventHandler } from "react";
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
import { getUserLogin } from "@/lib/user";

function getCompanyAbbreviation(fullName: string, maxLetters = 3): string {
  if (!fullName) return "";

  // Split nama perusahaan jadi kata-kata
  const words = fullName.split(" ").filter((w) => w.length > 0);

  // Ambil huruf pertama tiap kata
  const initials = words.map((w) => w[0].toUpperCase());

  // Ambil maksimal maxLetters huruf
  return initials.slice(0, maxLetters).join("");
}

function formatDateTimeEN(isoString: string): string {
  const date = new Date(isoString);

  const day = date.getDate();

  // Nama bulan bahasa Inggris
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

  // Jam 12-hour
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 jadi 12

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
  const { user } = getUserLogin();
  return (
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
                    <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
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
                <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
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
          Hello! Good Morning
        </p>
        <p className="text-[#181818] text-xs sm:text-sm md:text-base">
          Berikut saya lampirkan surat jalan untuk pemakaian material, jika ada
          kendala silahkan hubungi WA berikut : 0821-5678-345
        </p>
        <p className="text-[#181818] text-xs sm:text-sm md:text-base">
          Thanks, Admin Gudang UPT Bandung
        </p>
      </div>

      <hr className="max-md:hidden border-t-4 border-gray-800 mb-6" />

      <div className="max-md:hidden mb-6 md:mb-8">
        <div className="w-full transform origin-top-left">
          {/* Fixed width document preview */}
          <div className="bg-white shadow-lg py-4">
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
                  Mohon diizinkan membawa barang-barang tersebut di bawah ini :
                </div>
                <div className="space-y-1 text-lg">
                  <div>
                    Untuk Keperluan :{" "}
                    <span className="font-semibold">
                      {email.surat_jalan.perihal}
                    </span>
                  </div>
                  <div>
                    Lokasi Asal :{" "}
                    <span className="font-semibold">
                      {email.surat_jalan.lokasi_asal}
                    </span>
                  </div>
                  <div>
                    Lokasi Tujuan :{" "}
                    <span className="font-semibold">
                      {email.surat_jalan.lokasi_tujuan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Materials Table */}
            <div className="mb-3 min-w-[300px] overflow-x-auto">
              <table className="border-t border-b border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-lg text-center">
                    <th className="border-2 border-gray-800  px-2 py-2">NO</th>
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
              <div>
                <div>
                  <span className="font-semibold">Kendaraan</span> :{" "}
                  {email.surat_jalan.informasi_kendaraan}
                </div>
                <div>
                  <span className="font-semibold">Pengemudi</span> :{" "}
                  {email.surat_jalan.nama_pengemudi}
                </div>
              </div>
              <div className="text-right">
                <div>Bandung,31 Januari 2025</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-16 text-sm text-center">
              <div>
                <div className="mb-2 text-lg">Yang Menerima,</div>
                <div className="font-bold mb-4 text-lg">
                  {email.surat_jalan.penerima.perusahaan_penerima}
                </div>

                {/* Signature Preview */}
                <div className="h-20 mb-4 flex items-center justify-center">
                  <div></div>
                </div>

                <div className="text-lg font-bold">
                  {email.surat_jalan.penerima.nama_penerima}
                </div>
              </div>

              <div>
                <div className="mb-2 text-lg">Yang menyerahkan,</div>
                <div className="font-bold mb-4 text-lg">
                  {email.surat_jalan.pengirim.departemen_pengirim}
                </div>

                {/* Signature Preview */}
                <div className="h-20 mb-4 flex items-center justify-center">
                  <div></div>
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
              const ext = attachment.name.split(".").pop()?.toUpperCase() || "";

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
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 sm:space-x-3">
        <button className="flex-1 sm:flex-none w-full sm:w-32 md:w-36 h-10 md:h-12 flex items-center justify-center space-x-1 px-3 sm:px-4 bg-[#006AD4] text-white rounded-lg hover:bg-blue-700 cursor-pointer text-xs sm:text-sm md:text-base">
          <Reply className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={4} />
          <span>Reply</span>
        </button>
      </div>
    </div>
  );
};
