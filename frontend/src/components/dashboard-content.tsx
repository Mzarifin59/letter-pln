"use client";

import { StickyNote, Check, Send, ArchiveX } from "lucide-react";

import {
  DynamicEmailData,
  EmailDataAdmin,
  EmailDataVendor,
  EmailDataOther,
  getPerihal,
  getTanggalSurat,
} from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { BeritaBongkaran } from "@/lib/interface";
import { JSX } from "react";

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  // Format tanggal ke dd/mm/yyyy
  const formattedDate = date.toLocaleDateString("en-GB");

  // Format jam (12 jam + am/pm)
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // kalau 0 jadi 12

  const formattedTime = `${hours}:${minutes}${ampm}`;

  return `${formattedDate} at ${formattedTime}`;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);
  const months = Math.floor(diffInSeconds / 2592000); // 30 hari
  const years = Math.floor(diffInSeconds / 31536000); // 365 hari

  if (diffInSeconds < 60) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 30) return `${days} hari lalu`;
  if (months < 12) return `${months} bulan lalu`;
  return `${years} tahun lalu`;
}

const statusIcons: Record<string, { icon: JSX.Element }> = {
  Draft: {
    icon: <StickyNote width={15} height={15} className="text-[#4263EB]" />,
  },
  Approve: {
    icon: (
      <Check
        width={15}
        height={15}
        className="text-[#009867] border border-[#009867] rounded-sm"
      />
    ),
  },
  "In Progress": {
    icon: <Send width={15} height={15} className="text-[#009867]" />,
  },
  Reject: {
    icon: <ArchiveX width={15} height={15} className="text-[#9D0C19]" />,
  },
};

interface HomeContentProps {
  allData: DynamicEmailData[];
}

export default function DashboardContentPage({ allData }: HomeContentProps) {
  const { user } = useUserLogin();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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

  // Filter data
  const draftData = allData.filter(
    (item) => item.surat_jalan.status_entry === "Draft"
  );

  const publishedData = allData.filter(
    (item) => item.surat_jalan.status_entry === "Published"
  );

  const draftDataThisMonth = draftData.filter((item) => {
    const tgl = new Date(getTanggalSuratLocal(item));
    return tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear;
  });

  const publishedDataThisMonth = publishedData.filter((item) => {
    const tgl = new Date(getTanggalSuratLocal(item));
    return tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear;
  });

  let suratData = [...draftData, ...publishedData];
  let suratDataThisMonth = [...draftDataThisMonth, ...publishedDataThisMonth];

  // Sort and filter berdasarkan role
  const sortByDate = (a: DynamicEmailData, b: DynamicEmailData) => {
    return (
      new Date(getTanggalSuratLocal(b)).getTime() -
      new Date(getTanggalSuratLocal(a)).getTime()
    );
  };

  if (user?.role?.name === "Admin") {
    suratDataThisMonth = suratDataThisMonth
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat === "Surat Jalan" ||
          item.surat_jalan.kategori_surat ===
            "Berita Acara Pemeriksaan Tim Mutu" ||
          isBeritaBongkaranComplete(item)
      );

    suratData = suratData
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat === "Surat Jalan" ||
          item.surat_jalan.kategori_surat ===
            "Berita Acara Pemeriksaan Tim Mutu" ||
          isBeritaBongkaranComplete(item)
      );
  } else if (user?.role?.name === "Vendor") {
    suratDataThisMonth = suratDataThisMonth
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat ===
            "Berita Acara Material Bongkaran" &&
          item.sender.email === user?.email
      );

    suratData = suratData
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat ===
            "Berita Acara Material Bongkaran" &&
          item.sender.email === user?.email
      );
  } else if (user?.role?.name === "Gardu Induk") {
    suratDataThisMonth = suratDataThisMonth
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat ===
            "Berita Acara Material Bongkaran" &&
          item.surat_jalan.status_entry !== "Draft" &&
          hasMengetahui(item.surat_jalan) &&
          (item.surat_jalan as BeritaBongkaran).mengetahui
            ?.departemen_mengetahui === user?.name
      );

    suratData = suratData
      .sort(sortByDate)
      .filter(
        (item) =>
          item.surat_jalan.kategori_surat ===
            "Berita Acara Material Bongkaran" &&
          item.surat_jalan.status_entry !== "Draft" &&
          (item.surat_jalan as BeritaBongkaran).mengetahui
            ?.departemen_mengetahui === user?.name
      );
  } else {
    const canShow = (item: DynamicEmailData) => {
      const kategori = item.surat_jalan.kategori_surat;

      // Handle Surat Jalan
      if (kategori === "Surat Jalan") {
        return item.surat_jalan.status_surat !== "Draft";
      }

      // Handle Berita Acara Pemeriksaan Tim Mutu
      if (kategori === "Berita Acara Pemeriksaan Tim Mutu") {
        return (
          item.surat_jalan.status_surat !== "Draft" &&
          item.surat_jalan.status_entry !== "Draft"
        );
      }

      // Handle Berita Acara Material Bongkaran
      const mengetahuiLengkap =
        hasMengetahui(item.surat_jalan) &&
        item.surat_jalan.status_surat !== "Reject" &&
        Boolean(item.surat_jalan.mengetahui?.ttd_mengetahui);

      return mengetahuiLengkap;
    };

    suratDataThisMonth = suratDataThisMonth
      .sort(sortByDate)
      .filter((item) => canShow(item));

    suratData = suratData.sort(sortByDate).filter((item) => canShow(item));
  }

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden bg-[#F6F9FF] min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          {/* Card Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                  <h3 className="text-[11px] sm:text-[12px] font-medium text-[#495057]">
                    Surat Dibuat
                  </h3>
                  <p className="plus-jakarta-sans text-3xl sm:text-4xl font-bold text-[#212529]">
                    {suratDataThisMonth.length}
                  </p>
                  <p className="text-[#9D9D9D] text-[9px] sm:text-[10px] font-medium">
                    Bulan ini
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-[#4263EB] border-4 sm:border-8 border-[#004EEB] rounded-full flex-shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 25 24"
                    fill="none"
                    className="sm:w-[25px] sm:h-[24px]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_55_918)">
                      <path
                        d="M12.3334 18H5.33337C4.80294 18 4.29423 17.7893 3.91916 17.4142C3.54409 17.0391 3.33337 16.5304 3.33337 16V6C3.33337 5.46957 3.54409 4.96086 3.91916 4.58579C4.29423 4.21071 4.80294 4 5.33337 4H19.3334C19.8638 4 20.3725 4.21071 20.7476 4.58579C21.1227 4.96086 21.3334 5.46957 21.3334 6V13.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.33337 6L12.3334 12L21.3334 6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.2917 17.0417H14.0417V15.9584H17.2917V12.7084H18.3751V15.9584H21.6251V17.0417H18.3751V20.2917H17.2917V17.0417Z"
                        fill="white"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_55_918">
                        <rect
                          width="24"
                          height="24"
                          fill="white"
                          transform="translate(0.333374)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                  <h3 className="text-[11px] sm:text-[12px] font-medium text-[#495057]">
                    {user?.role?.name === "Admin"
                      ? "Surat Terkirim"
                      : "Surat Disetujui"}
                  </h3>
                  <p className="plus-jakarta-sans text-3xl sm:text-4xl font-bold text-[#212529]">
                    {user?.role?.name === "Admin"
                      ? publishedDataThisMonth.length
                      : suratDataThisMonth.filter(
                          (item) => item.surat_jalan.status_surat === "Approve"
                        ).length}
                  </p>
                  <p className="text-[#9D9D9D] text-[9px] sm:text-[10px] font-medium">
                    Bulan ini
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-[#00BE4D] border-4 sm:border-8 border-[#00A543] rounded-full flex-shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 25 24"
                    fill="none"
                    className="sm:w-[25px] sm:h-[24px]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.6667 18H5.66675C5.13632 18 4.62761 17.7893 4.25253 17.4142C3.87746 17.0391 3.66675 16.5304 3.66675 16V6C3.66675 5.46957 3.87746 4.96086 4.25253 4.58579C4.62761 4.21071 5.13632 4 5.66675 4H19.6667C20.1972 4 20.7059 4.21071 21.081 4.58579C21.456 4.96086 21.6667 5.46957 21.6667 6V13.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.66675 6L12.6667 12L21.6667 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.6667 18H21.6667"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.6667 15L21.6667 18L18.6667 21"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                  <h3 className="text-[11px] sm:text-[12px] font-medium text-[#495057]">
                    {user?.role?.name === "Vendor"
                      ? "Menunggu Tanda Tangan"
                      : "Menunggu Persetujuan"}
                  </h3>
                  <p className="plus-jakarta-sans text-3xl sm:text-4xl font-bold text-[#212529]">
                    {
                      suratData.filter(
                        (item) =>
                          item.surat_jalan.status_surat === "In Progress"
                      ).length
                    }
                  </p>
                  <p className="text-[#9D9D9D] text-[9px] sm:text-[10px] font-medium">
                    Perlu Tindakan
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-[#FB6C2B] border-4 sm:border-8 border-[#F24B00] rounded-full flex-shrink-0">
                  <svg
                    width="18"
                    height="19"
                    viewBox="0 0 22 23"
                    fill="none"
                    className="sm:w-[22px] sm:h-[23px]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.4762 6.64249L9.9048 15.2139L4.76195 10.0711M7.04766 21.5H15.6191C17.1905 21.5 18.5358 20.9405 19.6548 19.8214C20.7738 18.7024 21.3334 17.3571 21.3334 15.7857V7.21429C21.3334 5.64286 20.7738 4.29762 19.6548 3.17857C18.5358 2.05952 17.1905 1.5 15.6191 1.5H7.04766C5.47623 1.5 4.13099 2.05952 3.01195 3.17857C1.8929 4.29762 1.33337 5.64286 1.33337 7.21429V15.7857C1.33337 17.3571 1.8929 18.7024 3.01195 19.8214C4.13099 20.9405 5.47623 21.5 7.04766 21.5Z"
                      stroke="white"
                      strokeWidth="1.33"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Row */}
          <div
            className={`${
              user?.role?.name === "Spv" || user?.role?.name === "Gardu Induk"
                ? "xl:grid-cols-2"
                : "xl:grid-cols-3"
            } grid grid-cols-1 gap-4 sm:gap-6`}
          >
            {/* Tabel Riwayat Card */}
            <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 shadow-sm flex flex-col w-full overflow-hidden">
              <div className="p-3 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="plus-jakarta-sans text-base sm:text-lg text-[#232323]">
                  Terbaru
                </h2>
                <button className="p-2 hover:bg-gray-50 rounded-lg">
                  <svg
                    width="4"
                    height="16"
                    viewBox="0 0 4 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="2" cy="2" r="2" fill="#9CA3AF" />
                    <circle cx="2" cy="8" r="2" fill="#9CA3AF" />
                    <circle cx="2" cy="14" r="2" fill="#9CA3AF" />
                  </svg>
                </button>
              </div>

              {/* Responsif Table */}
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full min-w-[640px] sm:min-w-0">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] sm:text-xs font-medium text-[#495057] py-2 sm:py-3 px-3 sm:px-6">
                        Tanggal
                      </th>
                      {user?.role?.name !== "Vendor" && (
                        <th className="text-left text-[10px] sm:text-xs font-medium text-[#495057] py-2 sm:py-3 px-3 sm:px-6">
                          Kepada
                        </th>
                      )}
                      <th className="text-left text-[10px] sm:text-xs font-medium text-[#495057] py-2 sm:py-3 px-3 sm:px-6">
                        Perihal
                      </th>
                      <th className="text-left text-[10px] sm:text-xs font-medium text-[#495057] py-2 sm:py-3 px-3 sm:px-6">
                        No Surat
                      </th>
                      <th className="text-left text-[10px] sm:text-xs font-medium text-[#495057] py-2 sm:py-3 px-3 sm:px-6">
                        Status
                      </th>
                    </tr>
                  </thead>
                  {user?.role?.name === "Admin" ||
                  user?.role?.name === "Vendor" ? (
                    <tbody>
                      {suratData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-50">
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            <div className="text-xs sm:text-sm text-[#212529] break-words">
                              <div>
                                {formatDateTime(getTanggalSuratLocal(item))}
                              </div>
                            </div>
                          </td>
                          {user?.role?.name !== "Vendor" && (
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#495057] break-words">
                              {item.recipient.name}
                            </td>
                          )}
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#212529] break-words max-w-[120px] sm:max-w-none">
                            {getPerihal(item)}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#495057] break-words">
                            {getNoSurat(item)}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            {item.surat_jalan.status_entry !== "Draft" ? (
                              <div
                                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl inline-block ${
                                  item.surat_jalan.status_surat ===
                                  "In Progress"
                                    ? "bg-yellow-100"
                                    : item.surat_jalan.status_surat ===
                                      "Approve"
                                    ? "bg-[#188580]/20"
                                    : "bg-red-100"
                                }`}
                              >
                                <span
                                  className={`plus-jakarta-sans text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                                    item.surat_jalan.status_surat ===
                                    "In Progress"
                                      ? "text-yellow-700"
                                      : item.surat_jalan.status_surat ===
                                        "Approve"
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {item.surat_jalan.status_surat}
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-gray-100 inline-block`}
                              >
                                <span className="plus-jakarta-sans text-[10px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                                  Draft
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ) : (
                    <tbody>
                      {suratData
                        .filter(
                          (item) => item.surat_jalan.status_entry !== "Draft"
                        )
                        .map((item, index) => (
                          <tr key={index} className="border-b border-gray-50">
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              <div className="text-xs sm:text-sm text-[#212529] break-words">
                                <div>
                                  <div>
                                    {formatDateTime(getTanggalSuratLocal(item))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {user?.role?.name !== "Vendor" && (
                              <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#495057] break-words">
                                {item.recipient.name}
                              </td>
                            )}
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#212529] break-words max-w-[120px] sm:max-w-none">
                              {getPerihal(item)}
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-[#495057] break-words">
                              {getNoSurat(item)}
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                              {item.surat_jalan.status_entry !== "Draft" ? (
                                <div
                                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl inline-block ${
                                    item.surat_jalan.status_surat ===
                                    "In Progress"
                                      ? "bg-yellow-100"
                                      : item.surat_jalan.status_surat ===
                                        "Approve"
                                      ? "bg-[#188580]/20"
                                      : "bg-red-100"
                                  }`}
                                >
                                  <span
                                    className={`plus-jakarta-sans text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                                      item.surat_jalan.status_surat ===
                                      "In Progress"
                                        ? "text-yellow-700"
                                        : item.surat_jalan.status_surat ===
                                          "Approve"
                                        ? "text-green-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {item.surat_jalan.status_surat}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-gray-100 inline-block`}
                                >
                                  <span className="plus-jakarta-sans text-[10px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                                    Draft
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            {/* New Activity Card */}
            {user?.role?.name !== "Spv" &&
              user?.role?.name !== "Gardu Induk" && (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm px-4 sm:px-[17.5px] py-4 sm:py-[25px]">
                  <div className="mb-4 sm:mb-8">
                    <div className="flex items-center justify-between">
                      <h2 className="plus-jakarta-sans text-base sm:text-lg font-bold text-[#232323]">
                        New Activity
                      </h2>
                      <span className="text-[10px] sm:text-[12px] text-[#232323] p-1.5 sm:p-2 bg-[#F3F4F6] rounded-sm">
                        5 Activity
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {suratData.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 sm:gap-3 border-b border-gray-100 pb-2 sm:pb-3"
                      >
                        <div className="p-1.5 sm:p-2 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                          {item.surat_jalan.status_entry !== "Draft"
                            ? statusIcons[item.surat_jalan.status_surat]?.icon
                            : statusIcons["Draft"].icon}
                        </div>
                        {/* Responsive direction: badge akan turun jika kategori surat panjang */}
                        <div className="flex flex-1 min-w-0 items-center justify-between  max-sm:items-start max-xl:gap-6">
                          <div className="flex flex-col flex-1 min-w-0 pr-2">
                            <p className="plus-jakarta-sans text-[10px] sm:text-xs font-semibold text-[#232323] break-words w-full">
                              {item.surat_jalan.kategori_surat}
                            </p>
                            <p className="plus-jakarta-sans text-[9px] sm:text-[10px] text-[#545454] mt-0.5 sm:mt-1">
                              oleh {item.sender.name} ·{" "}
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                          <div className="ml-2 sm:ml-4 flex-shrink-0 max-w-[50vw] sm:max-w-none mt-2 max-sm:ml-0 max-sm:mt-2">
                            {item.surat_jalan.status_entry !== "Draft" ? (
                              <span
                                className={`plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium block w-max max-w-full text-ellipsis whitespace-nowrap overflow-hidden
                                ${
                                  item.surat_jalan.status_surat ===
                                  "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : item.surat_jalan.status_surat ===
                                      "Approve"
                                    ? "bg-green-100 text-green-700"
                                    : item.surat_jalan.status_surat === "Reject"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              `}
                                style={{ maxWidth: "120px" }}
                              >
                                {item.surat_jalan.status_surat === "Approve"
                                  ? "Disetujui"
                                  : item.surat_jalan.status_surat ===
                                    "In Progress"
                                  ? "Terkirim"
                                  : "Dibatalkan"}
                              </span>
                            ) : (
                              <span
                                className="plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 block w-max max-w-full text-ellipsis whitespace-nowrap overflow-hidden"
                                style={{ maxWidth: "120px" }}
                              >
                                Draft
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
    </>
  );
}
