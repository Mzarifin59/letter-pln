"use client";

import {
  Search,
  SlidersVertical,
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUserLogin } from "@/lib/user";
import qs from "qs";
import { useEffect, useState } from "react";
import { EmailData } from "@/lib/interface";
import { useRouter } from "next/navigation";

async function getEmail() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = qs.stringify({
    sort: ["createdAt:asc"],
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
          category_surat: true,
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

  const res = await fetch(`${apiUrl}/api/emails?${query}`);
  const data = await res.json();
  return data.data;
}

export default function Header() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user, loading } = useUserLogin();
  const router = useRouter();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setEmailLoading(true);
        const data = await getEmail();
        setEmails(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching emails:", err);
        } else {
          console.error("Unknown error:", err);
        }
      } finally {
        setEmailLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const unReadEmail = emails.filter((email) => {
    if (!email.email_statuses || email.email_statuses.length === 0) {
      return true;
    }

    const userStatus = email.email_statuses.find(
      (status) => status.user.email === user?.email
    );

    return !userStatus || userStatus.is_read === false;
  });

  const unreadCount = unReadEmail.length;

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  // Handler untuk redirect berdasarkan status
  const handleNotificationClick = (status: string) => {
    const statusRoutes: { [key: string]: string } = {
      Rejected: "/admin/reject",
      "In Progress": "/admin/sent",
    };

    const route = statusRoutes[status] || "/";
    window.location.href = route;
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Get badge color based on status
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Rejected: "bg-red-100 text-red-700",
      Approved: "bg-green-100 text-green-700",
      Pending: "bg-yellow-100 text-yellow-700",
      Draft: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-blue-100 text-blue-700";
  };

  return (
    <div className="lg:ml-72 flex-1 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left Section - Mobile Menu + Search */}
          <div className="flex items-center gap-3 flex-1">
            {/* Search Section */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="flex items-center gap-3 bg-[#F6F9FF] rounded-xl px-4 py-3">
                <Search size={20} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by No. Surat Jalan"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-transparent border-none outline-none flex-1 text-gray-700 placeholder-gray-500"
                />
                <div className="h-5 w-px bg-[#0056B0] mx-2"></div>
                <button
                  type="submit"
                  className="text-gray-500 hover:text-[#0056B0] transition-colors"
                >
                  <SlidersVertical size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Action Icons */}
            <div className="flex items-center gap-3">
              {/* Bell Notification with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-gray-500 hover:text-[#0056B0] hover:bg-[#F2F5FE] rounded-lg transition-all relative">
                    <Bell size={20} />
                    {/* Badge untuk unread emails */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-96 max-h-[500px] overflow-y-auto"
                >
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-normal text-gray-500">
                        {unreadCount} unread
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Notification Items */}
                  {emailLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : unReadEmail.length === 0 ? (
                    <div className="p-8 text-center">
                      <Mail className="mx-auto mb-2 text-gray-300" size={48} />
                      <p className="text-gray-500 text-sm">No unread emails</p>
                    </div>
                  ) : (
                    unReadEmail.map((email) => (
                      <DropdownMenuItem
                        key={email.id}
                        className="flex flex-col items-start p-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                        onClick={() =>
                          handleNotificationClick(
                            email.surat_jalan?.status_surat || ""
                          )
                        }
                      >
                        <div className="w-full">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                                {email.surat_jalan?.no_surat_jalan ||
                                  "No Number"}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Clock size={12} />
                                {formatDate(email.createdAt)}
                              </p>
                            </div>
                            {email.surat_jalan?.status_surat && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getStatusColor(
                                  email.surat_jalan.status_surat
                                )}`}
                              >
                                {email.surat_jalan.status_surat}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {email.surat_jalan?.perihal || "No description"}
                          </p>

                          {/* From/To Info */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>From: {email.sender?.name || "Unknown"}</span>
                            <span>•</span>
                            <span>To: {email.to_company || "Unknown"}</span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}

                  {/* View All Link */}
                  {unReadEmail.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-center text-[#0056B0] hover:text-[#0056B0] font-medium cursor-pointer justify-center"
                        onClick={() => (window.location.href = "/admin/inbox")}
                      >
                        View all emails
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Divider - hidden di mobile */}
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors group">
                  <div className="w-10 h-10 bg-[#0056B0] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <p className="text-sm font-medium text-gray-800">
                      {loading ? "Loading..." : user?.name ?? "Guest"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className="hidden sm:block text-gray-400 group-hover:text-gray-600 transition-colors"
                  />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/logout";
                  }}
                  className="text-red-400 focus:text-red-500"
                >
                  <LogOut
                    width={20}
                    height={20}
                    className="text-red-400 focus:text-red-500"
                  />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  );
}