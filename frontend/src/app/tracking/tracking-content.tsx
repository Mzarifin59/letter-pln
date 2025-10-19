"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { EmailData } from "@/lib/interface";

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  // Array nama bulan
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

interface TrackingContentProps {
  data: EmailData[];
}

export default function TrackingContentPage({ data }: TrackingContentProps) {
  const dataEmail = data.sort(
    (a, b) =>
      new Date(b.surat_jalan.tanggal).getTime() -
      new Date(a.surat_jalan.tanggal).getTime()
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const itemPerPage = 15;
  const totalPages = Math.ceil(data.length / itemPerPage);

  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = startIndex + itemPerPage;
  const currentData = dataEmail.slice(startIndex, endIndex);

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

  return (
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
                    "Status",
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
                      {item.surat_jalan.status_entry !== "Draft" ? (
                        <span
                          className={`${
                            item.surat_jalan.status_surat === "Approve"
                              ? "text-[#188580] bg-[#188580]/20"
                              : item.surat_jalan.status_surat === "Reject"
                              ? "text-[#A62344] bg-[#A62344]/20"
                              : "text-[#D3A518] bg-[#D3A518]/20"
                          } plus-jakarta-sans  font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                        >
                          {item.surat_jalan.status_surat}
                        </span>
                      ) : (
                        <span
                          className={`text-gray-600 bg-gray-100 plus-jakarta-sans  font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                        >
                          Draft
                        </span>
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
                  {row.surat_jalan.status_entry !== "Draft" ? (
                    <span
                      className={`${
                        row.surat_jalan.status_surat === "Approve"
                          ? "text-[#188580] bg-[#188580]/20"
                          : row.surat_jalan.status_surat === "Reject"
                          ? "text-[#A62344] bg-[#A62344]/20"
                          : "text-[#D3A518] bg-[#D3A518]/20"
                      } plus-jakarta-sans  font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                    >
                      {row.surat_jalan.status_surat}
                    </span>
                  ) : (
                    <span
                      className={`text-gray-600 bg-gray-100 plus-jakarta-sans  font-semibold text-sm px-3 py-1 rounded-2xl inline-block`}
                    >
                      Draft
                    </span>
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
  );
}
