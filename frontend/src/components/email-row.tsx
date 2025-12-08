"use client";

import { JSX } from "react";
import {
  DynamicEmailData,
  isVendorEmailData,
  EmailDataAdmin,
  EmailDataVendor,
  EmailDataOther,
  getPerihal,
  getPerusahaanPenerima,
  getTanggalSurat,
} from "@/lib/interface";
import { Star, Trash2 } from "lucide-react";
import { useUserLogin } from "@/lib/user";

interface EmailRow {
  isSelected: boolean;
  onSelect: (emailId: string) => void;
  onClick?: (email: DynamicEmailData) => void;
  email: DynamicEmailData;
  openedEmail: DynamicEmailData | null;
  markEmailAsBookmarked?: (id: string) => void;
  pageRow?: "Reject" | "Send" | "Draft";
  onDelete?: (email: DynamicEmailData) => void;
}

function formatDate(dateString: string, type: "long" | "short" = "long") {
  const date = new Date(dateString);

  if (type === "long") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (type === "short") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  return dateString;
}

function getCompanyAbbreviation(fullName: string, maxLetters = 3): string {
  if (!fullName) return "";

  // Split nama perusahaan jadi kata-kata
  const words = fullName.split(" ").filter((w) => w.length > 0);

  // Ambil huruf pertama tiap kata
  const initials = words.map((w) => w[0].toUpperCase());

  // Ambil maksimal maxLetters huruf
  return initials.slice(0, maxLetters).join("");
}

export const EmailRowInbox = ({
  email,
  isSelected,
  onSelect,
  onClick,
  openedEmail,
  onDelete,
  markEmailAsBookmarked,
}: EmailRow): JSX.Element => {
  const isOpened = openedEmail?.id === email.id;
  const { user } = useUserLogin();

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

  // Fungsi untuk memotong perihal sesuai jumlah kata dan maksimal karakter:
  // - 8 kata atau 60 karakter, mana yang lebih dulu tercapai
  function truncatePerihal(text: string, maxWords = 8, maxChars = 60) {
    if (!text) return "";
    // Potong karakter dulu
    let truncatedText = text.length > maxChars ? text.slice(0, maxChars) : text;
    // Potong kata
    const words = truncatedText.split(" ").slice(0, maxWords);
    truncatedText = words.join(" ");
    // Pastikan tidak menembus row/kebawah: hilangkan spasi akhir
    truncatedText = truncatedText.trim();
    // Jika masih lebih panjang dari maxChars, potong akhir dan tambahkan titik-titik
    if (truncatedText.length > maxChars) {
      truncatedText = truncatedText.slice(0, maxChars - 3).trim() + "...";
    }
    // Jika konten aslinya lebih panjang, tambahkan titik-titik juga
    if (truncatedText.length < text.length) {
      truncatedText = truncatedText.replace(/\s+$/, "") + "...";
    }
    return truncatedText;
  }

  // Menentukan background color untuk avatar perusahaan
  const kategoriSurat = email?.surat_jalan?.kategori_surat;
  const companyAvatarBg =
    kategoriSurat && kategoriSurat.toLowerCase().includes("surat jalan")
      ? "bg-[#0056B0]"
      : "bg-[#FFBE5F]";

  return (
    <div
      className={`
        group gap-4 cursor-pointer
        border-b border-[#ADB5BD] px-4 py-3
        hover:bg-[#EDF1FF]
        ${isSelected ? "bg-blue-50" : ""}
        ${isOpened ? "bg-blue-100" : ""}
        ${
          openedEmail
            ? "min-h-max"
            : "grid grid-cols-[auto_auto_1fr_auto_auto_auto] max-[1440px]:grid-cols-[auto_auto_1fr_auto_auto] max-sm:grid-cols-[auto_auto_1fr_auto]"
        }
        ${isOpened ? "items-start" : "items-center"}
      `}
      onClick={() => onClick?.(email)}
    >
      {/* Checkbox & Star */}
      <div
        className={`flex items-center gap-2 w-[60px] flex-shrink-0 max-sm:order-1 ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onSelect(email.documentId)}
          className="rounded border-gray-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            markEmailAsBookmarked?.(email.documentId);
          }}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Toggle bookmark"
        >
          <Star
            className={`w-4 h-4 transition-colors duration-200 ${
              email.email_statuses.find((item) => item.user.name === user?.name)
                ?.is_bookmarked
                ? "text-yellow-400 fill-yellow-400"
                : "text-[#E9E9E9]"
            }`}
          />
        </button>
      </div>

      {/* Avatar */}
      <div
        className={`
          flex h-10 w-10 items-center justify-center flex-shrink-0
          rounded-full text-sm font-medium text-white ${companyAvatarBg}
          max-sm:order-2 max-sm:hidden
          ${openedEmail ? "hidden" : ""}
        `}
      >
        {getCompanyAbbreviation(getPerusahaanPenerima(email))}
      </div>

      {/* Sender & Preview */}
      <div className="min-w-0 max-sm:order-3">
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[180px_1fr] gap-3 items-start max-xl:grid-cols-1">
            <span className="text-sm font-medium text-gray-900 whitespace-normal break-words">
              {getPerusahaanPenerima(email)}
            </span>

            {/* Subject */}
            {!openedEmail && (
              <span className="text-sm font-medium text-[#0056B0] whitespace-normal break-words max-xl:hidden">
                {email.surat_jalan.kategori_surat}
              </span>
            )}

            {/* Subject (mobile) */}
            {!openedEmail && (
              <span className="text-sm font-medium text-[#0056B0] whitespace-normal break-words xl:hidden">
                {email.surat_jalan.kategori_surat}
              </span>
            )}
          </div>

          {/* Preview */}
          {!openedEmail && (
            <span 
              className="text-sm text-[#545454] whitespace-normal break-words min-[1440px]:hidden"
              title={getPerihal(email)}
            >
              <span className="max-md:hidden">{getPerihal(email)}</span>
              <span className="md:hidden">
                {truncatePerihal(getPerihal(email) ?? "")}
              </span>
            </span>
          )}

          {/* Preview (opened) */}
          {openedEmail && (
            <span className="text-sm text-[#545454] whitespace-normal break-words">
              {getPerihal(email)}
            </span>
          )}

          {/* Attachments (responsive) */}
          {!openedEmail &&
            (() => {
              const suratJalan = email.surat_jalan as any;
              const hasLampiran =
                "lampiran" in suratJalan &&
                suratJalan.lampiran &&
                Array.isArray(suratJalan.lampiran) &&
                suratJalan.lampiran.length > 0;

              if (!hasLampiran) return null;

              const lampiran = suratJalan.lampiran as Array<{ name: string }>;
              const firstAttachment = lampiran[0];
              const hasMore = lampiran.length > 1;

              return (
                <div className="flex items-center space-x-1 min-[1440px]:hidden">
                  <div className="flex h-3 w-3 items-center justify-center rounded bg-green-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {firstAttachment.name}
                  </span>
                  {hasMore && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      dan lainnya
                    </span>
                  )}
                </div>
              );
            })()}

          {/* Attachments (opened) */}
          {openedEmail &&
            (() => {
              const suratJalan = email.surat_jalan as any;
              const hasLampiran =
                "lampiran" in suratJalan &&
                suratJalan.lampiran &&
                Array.isArray(suratJalan.lampiran) &&
                suratJalan.lampiran.length > 0;

              if (!hasLampiran) return null;

              const lampiran = suratJalan.lampiran as Array<{ name: string }>;
              const firstAttachment = lampiran[0];
              const hasMore = lampiran.length > 1;

              return (
                <div className="flex items-center space-x-1">
                  <div className="flex h-3 w-3 items-center justify-center rounded bg-green-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {firstAttachment.name}
                  </span>
                  {hasMore && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      dan lainnya
                    </span>
                  )}
                </div>
              );
            })()}
        </div>
      </div>

      {/* Perihal & Attachments (desktop wide) */}
      <div
        className={`min-w-[200px] max-w-[200px] max-[1440px]:hidden ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <div className="flex flex-col gap-2">
          <span 
            className="text-sm text-[#545454] whitespace-normal break-words max-xl:hidden"
            title={getPerihal(email)}
          >
            <span className="max-md:hidden">{getPerihal(email)}</span>
            <span className="md:hidden">
              {truncatePerihal(getPerihal(email) ?? "")}
            </span>
          </span>

          {/* Attachments */}
          {(() => {
            const suratJalan = email.surat_jalan as any;
            const hasLampiran =
              "lampiran" in suratJalan &&
              suratJalan.lampiran &&
              Array.isArray(suratJalan.lampiran) &&
              suratJalan.lampiran.length > 0;

            if (!hasLampiran) return null;

            const lampiran = suratJalan.lampiran as Array<{ name: string }>;
            const firstAttachment = lampiran[0];
            const hasMore = lampiran.length > 1;

            return (
              <div className="flex items-center space-x-1">
                <div className="flex h-3 w-3 items-center justify-center rounded bg-green-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[200px]">
                  {firstAttachment.name}
                </span>
                {hasMore && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    dan lainnya
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Status Badge */}
      <div
        className={`min-w-[120px] max-w-[120px] flex justify-center max-md:hidden ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <div
          className={`px-3 py-1 rounded-xl ${
            email.surat_jalan.status_surat === "In Progress"
              ? "bg-yellow-100"
              : email.surat_jalan.status_surat === "Approve"
              ? "bg-[#188580]/20"
              : "bg-red-100"
          }`}
        >
          <span
            className={`plus-jakarta-sans text-xs font-medium whitespace-nowrap ${
              email.surat_jalan.status_surat === "In Progress"
                ? "text-yellow-700"
                : email.surat_jalan.status_surat === "Approve"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {email.surat_jalan.status_surat}
          </span>
        </div>
      </div>

      {/* Time & Status (mobile) */}
      <div
        className={`min-w-[100px] max-w-[120px] flex flex-col items-end justify-end gap-2 md:hidden max-md:order-4 ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <div className="relative flex items-end">
          <span className="text-[10px] text-gray-500 whitespace-nowrap group-hover:opacity-0 transition-opacity">
            {formatDate(getTanggalSuratLocal(email), "short")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(email);
            }}
            className="absolute inset-0 flex items-end justify-end opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
          </button>
        </div>
        <div
          className={`px-3 py-1 rounded-xl ${
            email.surat_jalan.status_surat === "In Progress"
              ? "bg-yellow-100"
              : email.surat_jalan.status_surat === "Approve"
              ? "bg-[#188580]/20"
              : "bg-red-100"
          }`}
        >
          <span
            className={`plus-jakarta-sans text-xs font-medium whitespace-nowrap ${
              email.surat_jalan.status_surat === "In Progress"
                ? "text-yellow-700"
                : email.surat_jalan.status_surat === "Approve"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {email.surat_jalan.status_surat}
          </span>
        </div>
      </div>

      {/* Time (desktop) with Trash */}
      <div
        className={`min-w-[150px] max-w-[200px] flex justify-end max-md:hidden relative ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap group-hover:opacity-0 transition-opacity">
          {formatDate(getTanggalSuratLocal(email), "long")}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(email);
          }}
          className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </button>
      </div>

      {/* Unread Indicator */}
      <div
        className={`flex items-center min-w-[20px] justify-end flex-shrink-0 max-sm:hidden ${
          openedEmail ? "hidden" : ""
        }`}
      >
        {!email.email_statuses.find((item) => item.user.name === user?.name)
          ?.is_read && (
          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export const EmailRow = ({
  email,
  isSelected,
  onSelect,
  onClick,
  openedEmail,
  markEmailAsBookmarked,
  pageRow,
  onDelete,
}: EmailRow) => {
  const isOpened = openedEmail?.documentId === email.documentId;
  const { user } = useUserLogin();

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

  // Fungsi untuk memotong perihal sesuai jumlah kata dan maksimal karakter:
  // - 8 kata atau 60 karakter, mana yang lebih dulu tercapai
  function truncatePerihal(text: string, maxWords = 8, maxChars = 60) {
    if (!text) return "";
    // Potong karakter dulu
    let truncatedText = text.length > maxChars ? text.slice(0, maxChars) : text;
    // Potong kata
    const words = truncatedText.split(" ").slice(0, maxWords);
    truncatedText = words.join(" ");
    // Pastikan tidak menembus row/kebawah: hilangkan spasi akhir
    truncatedText = truncatedText.trim();
    // Jika masih lebih panjang dari maxChars, potong akhir dan tambahkan titik-titik
    if (truncatedText.length > maxChars) {
      truncatedText = truncatedText.slice(0, maxChars - 3).trim() + "...";
    }
    // Jika konten aslinya lebih panjang, tambahkan titik-titik juga
    if (truncatedText.length < text.length) {
      truncatedText = truncatedText.replace(/\s+$/, "") + "...";
    }
    return truncatedText;
  }

  return (
    <div
      className={`
        group grid gap-3 cursor-pointer
        px-4 py-3 border-b border-[#ADB5BD]
        hover:bg-[#EDF1FF]
        ${isSelected ? "bg-blue-50" : ""}
        ${isOpened ? "bg-blue-100" : ""}
        ${
          openedEmail
            ? "grid-cols-1"
            : "grid-cols-[auto_1fr_auto_auto_auto] max-sm:grid-cols-[auto_1fr_auto_auto]"
        }
        ${isOpened ? "items-start" : "items-center"}
      `}
      onClick={() => onClick?.(email)}
    >
      {/* Checkbox & Star */}
      <div
        className={`flex items-center gap-2 w-[60px] flex-shrink-0 max-sm:order-1 ${
          openedEmail ? "hidden" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            onSelect(email.documentId);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            markEmailAsBookmarked?.(email.documentId);
          }}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Toggle bookmark"
        >
          <Star
            className={`w-4 h-4 transition-colors duration-200 ${
              email.email_statuses.find((item) => item.user.name === user?.name)
                ?.is_bookmarked
                ? "text-yellow-400 fill-yellow-400"
                : "text-[#E9E9E9]"
            }`}
          />
        </button>
      </div>

      {/* Status & Sender*/}
      <div
        className={`${
          openedEmail ? "items-start" : "items-start sm:items-center"
        } flex gap-2 min-w-0 max-sm:flex-col max-sm:order-3`}
      >
        {/* Status */}
        <div
          className={`min-w-[80px] max-w-[80px] flex-shrink-0 ${
            pageRow === "Reject"
              ? "text-[#A62344]"
              : pageRow === "Draft"
              ? "text-[#A62344]"
              : "text-gray-900"
          } text-xs sm:text-sm font-semibold`}
        >
          {pageRow === "Reject"
            ? "Dibatalkan"
            : pageRow === "Send"
            ? "Kepada :"
            : "Draft"}
        </div>

        {/* Sender & Preview (desktop + mobile if openedEmail) */}
        <div
          className={`min-w-0 ${
            !openedEmail ? "max-sm:hidden" : "max-sm:order-3"
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[200px_1fr] gap-3 items-center  max-xl:grid-cols-1">
              <span className="text-sm font-medium text-gray-900 whitespace-normal break-words">
                {getPerusahaanPenerima(email)}
              </span>
              {!openedEmail && (
                <span className="text-sm text-[#545454] whitespace-normal break-words max-xl:hidden">
                  {getPerihal(email)}
                </span>
              )}
            </div>
            <span
              className={`text-sm text-[#545454] block whitespace-normal break-words ${
                openedEmail
                  ? ""
                  : "xl:hidden"
              }`}
              title={getPerihal(email)}
              style={{
                display: "block",
                overflow: "hidden",
                ...(window.innerWidth <= 768
                  ? {
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }
                  : {}),
              }}
            >
              <span className="xl:hidden">
                {truncatePerihal(getPerihal(email) ?? "")}
              </span>
            </span>
          </div>
        </div>

        {/* Sender & Preview (mobile-only, !openedEmail, order-3) */}
        {!openedEmail && (
          <div className="min-w-0 max-sm:order-3 sm:hidden">
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-[200px_1fr] gap-3 items-start max-xl:grid-cols-1">
                <span className="text-sm font-medium text-gray-900 whitespace-normal break-words">
                  {getPerusahaanPenerima(email)}
                </span>
                <span className="text-sm text-[#545454] whitespace-normal break-words max-xl:hidden max-md:truncate">
                  <span className="max-md:hidden">{getPerihal(email)}</span>
                  <span className="md:hidden">
                    {truncatePerihal(getPerihal(email) ?? "")}
                  </span>
                </span>
              </div>
              <span className="text-sm text-[#545454] block whitespace-normal break-words xl:hidden max-md:truncate">
                <span className="max-md:hidden">{getPerihal(email)}</span>
                <span className="md:hidden">
                  {truncatePerihal(getPerihal(email) ?? "")}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Time with Trash */}
      <div
        className={`min-w-[150px] max-w-[200px] flex items-center justify-end flex-shrink-0 max-sm:hidden relative ${
          openedEmail ? "invisible" : ""
        }`}
      >
        <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap group-hover:opacity-0 transition-opacity">
          {formatDate(email.surat_jalan.createdAt, "long")}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(email);
          }}
          className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </button>
      </div>

      {/* Time (mobile) with Trash */}
      <div
        className={`min-w-[100px] max-w-[120px] flex justify-end items-center flex-shrink-0 sm:hidden relative max-sm:order-4 ${
          openedEmail ? "invisible" : ""
        }`}
      >
        <span className="text-[10px] text-gray-500 whitespace-nowrap group-hover:opacity-0 transition-opacity">
          {formatDate(email.surat_jalan.createdAt, "short")}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(email);
          }}
          className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </button>
      </div>

      {/* Unread Indicator */}
      {pageRow !== "Draft" && (
        <div
          className={`flex items-center min-w-[20px] justify-end flex-shrink-0 max-sm:hidden ${
            openedEmail ? "invisible" : ""
          }`}
        >
          {!email.email_statuses.find((item) => item.user.name === user?.name)
            ?.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  );
};
