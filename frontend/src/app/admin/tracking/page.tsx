import { ArrowLeft, ArrowRight } from "lucide-react";

export default function TrackingPage() {
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
              <ArrowLeft
                width={20}
                height={20}
                className="hover:text-gray-400 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full"
              />
              <span className="text-sm text-gray-500">1 of 200</span>
              <ArrowRight
                width={20}
                height={20}
                className="hover:text-gray-400 text-gray-600 cursor-pointer bg-[#F4F4F4] rounded-full"
              />
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
                <tr className="border-t border-[#ADB5BD]">
                  <td className="py-4 px-6 text-sm text-[#545454]">1</td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    22 Juli 2025 16:05
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Admin Gudang
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    SPV Logistik
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Pelaksanaan Evaluasi Material untuk Usulan Bursa dan
                    Penghapusan
                  </td>
                  <td className="py-4 px-6">
                    <span className="plus-jakarta-sans text-[#188580] font-semibold text-sm px-3 py-1 bg-[#188580]/20 rounded-2xl inline-block">
                      Approve
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-[#ADB5BD]">
                  <td className="py-4 px-6 text-sm text-[#545454]">2</td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    22 Juli 2025 16:05
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Admin Gudang
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    SPV Logistik
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Pelaksanaan Evaluasi Material untuk Usulan Bursa dan
                    Penghapusan
                  </td>
                  <td className="py-4 px-6">
                    <span className="plus-jakarta-sans text-[#D3A518] font-semibold text-sm px-3 py-1 bg-[#D3A518]/20 rounded-2xl inline-block">
                      In Progress
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-[#ADB5BD]">
                  <td className="py-4 px-6 text-sm text-[#545454]">3</td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    22 Juli 2025 16:05
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Admin Gudang
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    SPV Logistik
                  </td>
                  <td className="py-4 px-6 text-sm text-[#545454]">
                    Pelaksanaan Evaluasi Material untuk Usulan Bursa dan
                    Penghapusan
                  </td>
                  <td className="py-4 px-6">
                    <span className="plus-jakarta-sans text-[#A62344] font-semibold text-sm px-3 py-1 bg-[#A62344]/20 rounded-2xl inline-block">
                      Rejected
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* versi mobile */}
          <div className="space-y-4 md:hidden">
            {[
              {
                no: 1,
                tgl: "22 Juli 2025 16:05",
                dari: "Admin Gudang",
                kepada: "SPV Logistik",
                perihal:
                  "Pelaksanaan Evaluasi Material untuk Usulan Bursa dan Penghapusan",
                status: "Approve",
                color: "text-[#188580] bg-[#188580]/20",
              },
              {
                no: 2,
                tgl: "22 Juli 2025 16:05",
                dari: "Admin Gudang",
                kepada: "SPV Logistik",
                perihal:
                  "Pelaksanaan Evaluasi Material untuk Usulan Bursa dan Penghapusan",
                status: "In Progress",
                color: "text-[#D3A518] bg-[#D3A518]/20",
              },
              {
                no: 3,
                tgl: "22 Juli 2025 16:05",
                dari: "Admin Gudang",
                kepada: "SPV Logistik",
                perihal:
                  "Pelaksanaan Evaluasi Material untuk Usulan Bursa dan Penghapusan",
                status: "Rejected",
                color: "text-[#A62344] bg-[#A62344]/20",
              },
            ].map((row) => (
              <div
                key={row.no}
                className="rounded-xl border border-[#ADB5BD] p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#232323]">
                    #{row.no}
                  </span>
                  <span
                    className={`plus-jakarta-sans text-xs font-semibold px-3 py-1 rounded-2xl ${row.color}`}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{row.tgl}</p>
                <p className="text-sm text-[#545454]">
                  <span className="font-medium">Dari:</span> {row.dari}
                </p>
                <p className="text-sm text-[#545454]">
                  <span className="font-medium">Kepada:</span> {row.kepada}
                </p>
                <p className="text-sm text-[#545454] mt-1">{row.perihal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
