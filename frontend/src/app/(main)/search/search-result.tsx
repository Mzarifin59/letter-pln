"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Building2,
  User,
  Clock,
  ArrowLeft,
  X,
} from "lucide-react";
import { EmailData } from "@/lib/interface";
import qs from "qs";
import Link from "next/link";
import { EmailDetail } from "@/components/detail-email";
import { useUserLogin } from "@/lib/user";

async function searchEmails(query: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const queryString = qs.stringify({
    filters: {
      surat_jalan: {
        no_surat_jalan: {
          $containsi: query,
        },
      },
    },
    populate: {
      surat_jalan: {
        populate: {
          materials: true,
          penerima: {
            fields: ["perusahaan_penerima", "nama_penerima"],
            populate: {
              ttd_penerima: {
                fields: ["name", "url"],
              },
            },
          },
          pengirim: {
            fields: ["departemen_pengirim", "nama_pengirim"],
            populate: {
              ttd_pengirim: {
                fields: ["name", "url"],
              },
            },
          },
          lampiran: {
            fields: ["name", "url"],
          },
        },
      },
      sender: {
        fields: ["name", "email"],
      },
      recipient: {
        fields: ["name", "email"],
      },
      email_statuses: {
        fields: ["is_read", "is_bookmarked", "read_at", "bookmarked_at"],
        populate: {
          user: {
            fields: ["name", "email"],
          },
        },
      },
      attachment_files: {
        fields: ["name", "url"],
      },
    },
  });

  const res = await fetch(`${apiUrl}/api/emails?${queryString}`);
  const data = await res.json();
  return data.data;
}

export default function SearchResultPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoriesParam = searchParams.get("categories") || "";
  const selectedCategories = categoriesParam ? categoriesParam.split(",") : [];
  
  const [results, setResults] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>(query);
  const [openedEmail, setOpenedEmail] = useState<EmailData | null>(null);
  const { user } = useUserLogin();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data: EmailData[] = await searchEmails(query);

        // Filter berdasarkan role user
        let filteredData =
          user?.role?.name === "Spv"
            ? data.filter((item) => item.surat_jalan.status_entry !== "Draft")
            : data;

        // Filter berdasarkan kategori jika ada
        if (selectedCategories.length > 0) {
          filteredData = filteredData.filter((item) =>
            selectedCategories.includes(item.surat_jalan?.kategori_surat || "")
          );
        }

        setResults(filteredData);
      } catch (err) {
        console.error("Error searching:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, categoriesParam, user?.role?.name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Pertahankan filter kategori saat search ulang
      const params = new URLSearchParams();
      params.set("q", searchInput.trim());
      if (categoriesParam) {
        params.set("categories", categoriesParam);
      }
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleRemoveCategory = (category: string) => {
    const newCategories = selectedCategories.filter((c) => c !== category);
    const params = new URLSearchParams();
    params.set("q", query);
    if (newCategories.length > 0) {
      params.set("categories", newCategories.join(","));
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    params.set("q", query);
    window.location.href = `/search?${params.toString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Rejected: "bg-red-100 text-red-700 border-red-200",
      Approved: "bg-green-100 text-green-700 border-green-200",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Draft: "bg-gray-100 text-gray-700 border-gray-200",
      "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
    };
    return colors[status] || "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Surat Jalan": "bg-blue-100 text-blue-700 border-blue-200",
      "Surat Bongkaran": "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleEmailClick = async (email: EmailData): Promise<void> => {
    setOpenedEmail(email);
  };

  const handleCloseDetail = (): void => {
    setOpenedEmail(null);
  };

  return (
    <div className="lg:ml-72 min-h-screen bg-gray-50">
      {/* Header Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0056B0] mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Inbox</span>
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 bg-[#F6F9FF] rounded-xl px-6 py-4 border-2 border-[#0056B0]/20 focus-within:border-[#0056B0] transition-colors">
              <Search size={24} className="text-[#0056B0]" />
              <input
                type="text"
                placeholder="Search by No. Surat Jalan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-gray-700 placeholder-gray-500 text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="bg-[#0056B0] text-white px-6 py-2 rounded-lg hover:bg-[#004494] transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </form>

          {/* Active Filters */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">
                Filtered by:
              </span>
              {selectedCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-2 bg-[#0056B0] text-white text-sm px-3 py-1.5 rounded-lg"
                >
                  {category}
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                type="button"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Search Info */}
          {query && (
            <p className="mt-4 text-sm text-gray-600">
              Showing results for:{" "}
              <span className="font-semibold text-gray-900">"{query}"</span>
              {selectedCategories.length > 0 && (
                <span className="text-gray-500">
                  {" "}
                  in {selectedCategories.join(", ")}
                </span>
              )}
              {!loading && (
                <span className="ml-2">
                  ({results.length} result{results.length !== 1 ? "s" : ""}{" "}
                  found)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex max-lg:flex-col gap-6">
          {/* LEFT SIDE - Search Result List */}
          <div
            className={`transition-all duration-300 ${
              openedEmail ? "lg:w-1/2" : "w-full"
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B0]"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : !query ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Start Your Search
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Enter a surat jalan number in the search box above to find
                  documents
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileText size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {selectedCategories.length > 0 ? (
                    <>
                      We couldn't find any surat  matching "{query}" in{" "}
                      {selectedCategories.join(", ")}. Try removing filters or
                      searching with a different number.
                    </>
                  ) : (
                    <>
                      We couldn't find any surat jalan matching "{query}". Try
                      searching with a different number.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((email) => {
                  const isOpened = openedEmail?.id === email.id;
                  return (
                    <div
                      key={email.id}
                      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                        isOpened ? "border-[#0056B0]" : ""
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {email.surat_jalan?.no_surat_jalan || "No Number"}
                            </h3>
                            {email.surat_jalan?.kategori_surat && (
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium border ${getCategoryBadgeColor(
                                  email.surat_jalan.kategori_surat
                                )}`}
                              >
                                {email.surat_jalan.kategori_surat}
                              </span>
                            )}
                            {email.surat_jalan?.status_surat && (
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(
                                  email.surat_jalan.status_surat
                                )}`}
                              >
                                {email.surat_jalan.status_surat}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">
                            {email.surat_jalan?.perihal || "No Subject"}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 transition-all duration-200 ${
                          openedEmail ? "hidden lg:grid" : "grid"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-gray-500">Date:</span>
                          <span className="text-gray-900 font-medium">
                            {email.surat_jalan?.tanggal
                              ? formatDate(email.surat_jalan.tanggal)
                              : "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-500">From:</span>
                          <span className="text-gray-900 font-medium">
                            {email.sender?.name || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-gray-500">Origin:</span>
                          <span className="text-gray-900 font-medium">
                            {email.surat_jalan?.lokasi_asal || "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-gray-500">Destination:</span>
                          <span className="text-gray-900 font-medium">
                            {email.surat_jalan?.lokasi_tujuan || "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-gray-500">To Company:</span>
                          <span className="text-gray-900 font-medium">
                            {email.to_company || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(email.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Materials Count */}
                      {email.surat_jalan?.materials &&
                        email.surat_jalan.materials.length > 0 && (
                          <div
                            className={`flex items-center gap-2 text-sm text-gray-600 mb-4 transition-all duration-200 ${
                              openedEmail ? "hidden lg:flex" : "flex"
                            }`}
                          >
                            <FileText size={16} className="text-gray-400" />
                            <span>
                              {email.surat_jalan.materials.length} material(s)
                              in this document
                            </span>
                          </div>
                        )}

                      {/* Action Button */}
                      <div
                        className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-100 ${
                          openedEmail ? "hidden lg:flex" : "flex"
                        }`}
                      >
                        <button
                          onClick={() => handleEmailClick(email)}
                          className="px-4 py-2 bg-[#0056B0] text-white rounded-lg hover:bg-[#004494] transition-colors font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Email Detail */}
          {openedEmail && (
            <div className="lg:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
              <EmailDetail
                email={openedEmail}
                handleCloseDetail={handleCloseDetail}
                isCanceled={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}