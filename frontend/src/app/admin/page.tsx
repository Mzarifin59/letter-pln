import { StickyNote, Check, Send, ArchiveX } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      {/* Main Content */}
      <main className="lg:ml-72 flex-1 p-8 overflow-hidden bg-[#F6F9FF] min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Card Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 items-start">
                  <h3 className="text-[12px] font-medium text-[#495057]">
                    Surat Dibuat
                  </h3>
                  <p className="plus-jakarta-sans text-4xl font-bold text-[#212529]">
                    24
                  </p>
                  <p className="text-[#9D9D9D] text-[10px] font-medium">
                    Bulan ini
                  </p>
                </div>
                <div className="p-3 bg-[#4263EB] border-8 border-[#004EEB] rounded-full">
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
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
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 items-start">
                  <h3 className="text-[12px] font-medium text-[#495057]">
                    Surat Terkirim
                  </h3>
                  <p className="plus-jakarta-sans text-4xl font-bold text-[#212529]">
                    13
                  </p>
                  <p className="text-[#9D9D9D] text-[10px] font-medium">
                    Bulan ini
                  </p>
                </div>
                <div className="p-3 bg-[#00BE4D] border-8 border-[#00A543] rounded-full">
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
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
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 items-start">
                  <h3 className="text-[12px] font-medium text-[#495057]">
                    Menunggu Persetujuan
                  </h3>
                  <p className="plus-jakarta-sans text-4xl font-bold text-[#212529]">
                    5
                  </p>
                  <p className="text-[#9D9D9D] text-[10px] font-medium">
                    Perlu Tindakan
                  </p>
                </div>
                <div className="p-3 bg-[#FB6C2B] border-8 border-[#F24B00] rounded-full">
                  <svg
                    width="22"
                    height="23"
                    viewBox="0 0 22 23"
                    fill="none"
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Tabel Riwayat Card */}
            <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 shadow-sm flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="plus-jakarta-sans text-lg text-[#232323]">
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-[#495057] py-3 px-6">
                        Tanggal
                      </th>
                      <th className="text-left text-xs font-medium text-[#495057] py-3 px-6">
                        Kepada
                      </th>
                      <th className="text-left text-xs font-medium text-[#495057] py-3 px-6">
                        Perihal
                      </th>
                      <th className="text-left text-xs font-medium text-[#495057] py-3 px-6">
                        No Surat
                      </th>
                      <th className="text-left text-xs font-medium text-[#495057] py-3 px-6">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm text-[#212529]">
                          <div>02/03/2024</div>
                          <div className="text-sm text-[#495057]">
                            at 1:35pm
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        2,183
                      </td>
                      <td className="py-4 px-4 text-sm text-[#212529]">
                        Discover our new app features
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        New app launch
                      </td>
                      <td className="py-4 px-4">
                        <span className="plus-jakarta-sans px-3 py-1 rounded-full text-xs font-medium bg-[#188580]/20 text-green-700">
                          Approve
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm text-[#212529]">
                          <div>02/03/2024</div>
                          <div className="text-sm text-[#495057]">
                            at 1:35pm
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        2,183
                      </td>
                      <td className="py-4 px-4 text-sm text-[#212529]">
                        Abandoned cart
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        Automated Email
                      </td>
                      <td className="py-4 px-4">
                        <span className="plus-jakarta-sans px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          In Progress
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm text-[#212529]">
                          <div>02/03/2024</div>
                          <div className="text-xs text-[#495057]">
                            at 1:35pm
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        2,183
                      </td>
                      <td className="py-4 px-4 text-sm text-[#212529]">
                        Discover our new app features
                      </td>
                      <td className="py-4 px-4 text-sm text-[#495057]">
                        New app launch
                      </td>
                      <td className="py-4 px-4">
                        <span className="plus-jakarta-sans px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Rejected
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* New Activity Card */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm px-[17.5px] py-[25px]">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="plus-jakarta-sans text-lg font-bold text-[#232323]">
                    New Activity
                  </h2>
                  <span className="text-[12px] text-[#232323] p-2 bg-[#F3F4F6] rounded-sm">
                    5 Activity
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {/* Activity Item 1 */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <StickyNote
                      width={15}
                      height={15}
                      className="text-[#4263EB]"
                    />
                  </div>
                  <div className="flex items-center max-xl:gap-6 min-w-0">
                    <div className="flex flex-wrap xl:flex-col max-xl:gap-6 max-sm:gap-0 max-xl:items-center">
                      <p className="plus-jakarta-sans text-xs font-semibold text-[#232323] truncate">
                        Permohonan Surat Jalan
                      </p>
                      <p className="plus-jakarta-sans text-[10px] text-[#545454] mt-1">
                        oleh Admin Gudang UPT · 2 jam lalu
                      </p>
                    </div>
                    <span className="plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ml-2">
                      Draft
                    </span>
                  </div>
                </div>

                {/* Activity Item 2 */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <Check
                      width={15}
                      height={15}
                      className="text-[#009867] border border-[#009867] rounded-sm"
                    />
                  </div>
                  <div className="flex items-center max-xl:gap-6 min-w-0">
                    <div className="flex flex-wrap xl:flex-col max-xl:gap-6 max-sm:gap-0 max-xl:items-center">
                      <p className="plus-jakarta-sans text-xs font-semibold text-[#232323] truncate">
                        Permohonan Surat Jalan
                      </p>
                      <p className="plus-jakarta-sans text-[10px] text-[#545454] mt-1">
                        oleh Admin Gudang UPT · 2 jam lalu
                      </p>
                    </div>
                    <span className="plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 ml-2">
                      Disetujui
                    </span>
                  </div>
                </div>

                {/* Activity Item 3 */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <Send width={15} height={15} className="text-[#009867]" />
                  </div>
                  <div className="flex items-center max-xl:gap-6 min-w-0">
                    <div className="flex flex-wrap xl:flex-col max-xl:gap-6 max-sm:gap-0 max-xl:items-center">
                      <p className="plus-jakarta-sans text-xs font-semibold text-[#232323] truncate">
                        Permohonan Surat Jalan
                      </p>
                      <p className="plus-jakarta-sans text-[10px] text-[#545454] mt-1">
                        oleh Admin Gudang UPT · 2 jam lalu
                      </p>
                    </div>
                    <span className="plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-2">
                      Terkirim
                    </span>
                  </div>
                </div>

                {/* Activity Item 4 */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <ArchiveX
                      width={15}
                      height={15}
                      className="text-[#9D0C19]"
                    />
                  </div>
                  <div className="flex items-center max-xl:gap-6 min-w-0">
                    <div className="flex flex-wrap xl:flex-col max-xl:gap-6 max-sm:gap-0 max-xl:items-center">
                      <p className="plus-jakarta-sans text-xs font-semibold text-[#232323] truncate">
                        Permohonan Surat Jalan
                      </p>
                      <p className="plus-jakarta-sans text-[10px] text-[#545454] mt-1">
                        oleh Admin Gudang UPT · 2 jam lalu
                      </p>
                    </div>
                    <span className="plus-jakarta-sans px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 ml-2">
                      Dibatalkan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
