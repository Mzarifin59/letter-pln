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
  Filter,
  SlidersVertical,
} from "lucide-react";
import {
  DynamicEmailData,
  isVendorEmailData,
  EmailDataVendor,
  EmailDataAdmin,
  EmailDataOther,
  getPerihal,
  getTanggalSurat,
  isBeritaPemeriksaanData,
} from "@/lib/interface";
import qs from "qs";
import Link from "next/link";
import { EmailDetail, EmailDetailBeritaBongkaran } from "@/components/detail-email";
import { EmailDetailBeritaPemeriksaan } from "@/components/detail-email-berita-pemeriksaan";
import { useUserLogin } from "@/lib/user";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type SearchType = "semua" | "no_surat" | "material" | "vendor";

interface FilterSuratJalan {
  kategori_surat?: { $eq: string } | Array<{ $eq: string }>;
  no_surat_jalan?: { $containsi: string };
  no_berita_acara?: { $containsi: string };
  materials?: {
    nama: { $containsi: string };
  };
  mengetahui?: {
    departemen_mengetahui: { $containsi: string };
  };
  pemeriksa_barang?: {
    departemen_pemeriksa?: { $containsi: string };
  };
  $or?: Array<{
    kategori_surat?: { $eq: string };
    no_surat_jalan?: { $containsi: string };
    no_berita_acara?: { $containsi: string };
    materials?: {
      nama: { $containsi: string };
    };
  }>;
}

interface SearchFilters {
  surat_jalan?: FilterSuratJalan;
  $or?: Array<{
    surat_jalan: {
      kategori_surat?: { $eq: string };
      no_surat_jalan?: { $containsi: string };
      no_surat_permintaan?: { $containsi: string };
      no_berita_acara?: { $containsi: string };
      no_perjanjian_kontrak?: { $containsi: string };
      perihal?: { $containsi: string };
      perihal_kontrak?: { $containsi: string };
      lokasi_asal?: { $containsi: string };
      lokasi_tujuan?: { $containsi: string };
      catatan_tambahan?: { $containsi: string };
      informasi_kendaraan?: { $containsi: string };
      nama_pengemudi?: { $containsi: string };
      hasil_pemeriksaan?: { $containsi: string };
      materials?: {
        nama: { $containsi: string };
      };
      penerima?: {
        perusahaan_penerima?: { $containsi: string };
        nama_penerima?: { $containsi: string };
      };
      pengirim?: {
        departemen_pengirim?: { $containsi: string };
        nama_pengirim?: { $containsi: string };
      };
      mengetahui?: {
        departemen_mengetahui?: { $containsi: string };
        nama_mengetahui?: { $containsi: string };
      };
      penyedia_barang?: {
        perusahaan_penyedia_barang?: { $containsi: string };
        nama_penanggung_jawab?: { $containsi: string };
      };
      pemeriksa_barang?: {
        departemen_pemeriksa?: { $containsi: string };
      };
    };
  }>;
}

async function searchEmails(
  query: string,
  searchType: SearchType,
  userRole: string
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Build filters based on search type and role
  const filters: SearchFilters = {};

  if (userRole === "Admin") {
    // Admin: Surat Jalan dan Berita Acara Pemeriksaan Tim Mutu
    if (searchType === "semua") {
      filters.$or = [
        // Surat Jalan - No. Surat
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            no_surat_jalan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            no_surat_permintaan: { $containsi: query },
          },
        },
        // Berita Acara Pemeriksaan Tim Mutu - No. Berita Acara
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            no_berita_acara: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            no_perjanjian_kontrak: { $containsi: query },
          },
        },
        // Perihal
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            perihal: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            perihal_kontrak: { $containsi: query },
          },
        },
        // Lokasi
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            lokasi_asal: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            lokasi_tujuan: { $containsi: query },
          },
        },
        // Material
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            materials: {
              nama: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            materials: {
              nama: { $containsi: query },
            },
          },
        },
        // Penerima
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            penerima: {
              perusahaan_penerima: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            penerima: {
              nama_penerima: { $containsi: query },
            },
          },
        },
        // Pengirim
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            pengirim: {
              departemen_pengirim: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            pengirim: {
              nama_pengirim: { $containsi: query },
            },
          },
        },
        // Penyedia Barang (Berita Acara Pemeriksaan)
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            penyedia_barang: {
              perusahaan_penyedia_barang: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            penyedia_barang: {
              nama_penanggung_jawab: { $containsi: query },
            },
          },
        },
        // Pemeriksa Barang
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            pemeriksa_barang: {
              departemen_pemeriksa: { $containsi: query },
            },
          },
        },
        // Field lainnya
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            catatan_tambahan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            informasi_kendaraan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            nama_pengemudi: { $containsi: query },
          },
        },
      ];
    } else if (searchType === "no_surat") {
      filters.$or = [
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            no_surat_jalan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            no_berita_acara: { $containsi: query },
          },
        },
      ];
    } else if (searchType === "material") {
      filters.$or = [
        {
          surat_jalan: {
            kategori_surat: { $eq: "Surat Jalan" },
            materials: {
              nama: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Pemeriksaan Tim Mutu" },
            materials: {
              nama: { $containsi: query },
            },
          },
        },
      ];
    }
  } else if (userRole === "Vendor" || userRole === "Gardu Induk") {
    // Vendor & Gardu Induk: hanya Berita Acara Material Bongkaran
    if (searchType === "semua") {
      filters.$or = [
        // No. Berita Acara & No. Perjanjian Kontrak
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            no_berita_acara: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            no_perjanjian_kontrak: { $containsi: query },
          },
        },
        // Perihal
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            perihal: { $containsi: query },
          },
        },
        // Lokasi
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            lokasi_asal: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            lokasi_tujuan: { $containsi: query },
          },
        },
        // Material
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            materials: {
              nama: { $containsi: query },
            },
          },
        },
        // Mengetahui (Vendor)
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            mengetahui: {
              departemen_mengetahui: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            mengetahui: {
              nama_mengetahui: { $containsi: query },
            },
          },
        },
        // Penerima
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            penerima: {
              perusahaan_penerima: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            penerima: {
              nama_penerima: { $containsi: query },
            },
          },
        },
        // Pengirim
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            pengirim: {
              departemen_pengirim: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            pengirim: {
              nama_pengirim: { $containsi: query },
            },
          },
        },
        // Field lainnya
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            informasi_kendaraan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
            nama_pengemudi: { $containsi: query },
          },
        },
      ];
    } else {
      filters.surat_jalan = {
        kategori_surat: { $eq: "Berita Acara Material Bongkaran" },
      };

      if (searchType === "no_surat") {
        filters.surat_jalan.no_berita_acara = { $containsi: query };
      } else if (searchType === "material") {
        filters.surat_jalan.materials = {
          nama: { $containsi: query },
        };
      } else if (searchType === "vendor") {
        filters.surat_jalan.mengetahui = {
          departemen_mengetahui: { $containsi: query },
        };
      }
    }
  } else if (userRole === "Spv") {
    // Spv: semua kategori, semua filter
    if (searchType === "semua") {
      filters.$or = [
        // No. Surat - field yang pasti ada
        {
          surat_jalan: {
            no_surat_jalan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            no_surat_permintaan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            no_berita_acara: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            no_perjanjian_kontrak: { $containsi: query },
          },
        },
        // Perihal
        {
          surat_jalan: {
            perihal: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            perihal_kontrak: { $containsi: query },
          },
        },
        // Lokasi
        {
          surat_jalan: {
            lokasi_asal: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            lokasi_tujuan: { $containsi: query },
          },
        },
        // Material
        {
          surat_jalan: {
            materials: {
              nama: { $containsi: query },
            },
          },
        },
        // Field lainnya yang pasti ada
        {
          surat_jalan: {
            catatan_tambahan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            informasi_kendaraan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            nama_pengemudi: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            hasil_pemeriksaan: { $containsi: query },
          },
        },
      ];
    } else if (searchType === "no_surat") {
      filters.$or = [
        {
          surat_jalan: {
            no_surat_jalan: { $containsi: query },
          },
        },
        {
          surat_jalan: {
            no_berita_acara: { $containsi: query },
          },
        },
      ];
    } else if (searchType === "material") {
      filters.surat_jalan = {
        materials: {
          nama: { $containsi: query },
        },
      };
    } else if (searchType === "vendor") {
      filters.$or = [
        {
          surat_jalan: {
            mengetahui: {
              departemen_mengetahui: { $containsi: query },
            },
          },
        },
        {
          surat_jalan: {
            pemeriksa_barang: {
              departemen_pemeriksa: { $containsi: query },
            },
          },
        },
      ];
    }
  }

  const queryString = qs.stringify({
    filters,
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
          mengetahui: {
            fields: ["departemen_mengetahui", "nama_mengetahui"],
            populate: {
              ttd_mengetahui: {
                fields: ["name", "url"],
              },
            },
          },
          penyedia_barang: {
            fields: ["perusahaan_penyedia_barang", "nama_penanggung_jawab"],
            populate: {
              ttd_penerima: {
                fields: ["name", "url"],
              },
            },
          },
          pemeriksa_barang: {
            fields: ["departemen_pemeriksa"],
            populate: {
              mengetahui: {
                fields: ["departemen_mengetahui", "nama_mengetahui"],
                populate: {
                  ttd_mengetahui: {
                    fields: ["name", "url"],
                  },
                },
              },
            },
          },
          lampiran: {
            fields: ["name", "url"],
          },
          cop_surat: {
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

  try {
    const res = await fetch(`${apiUrl}/api/emails?${queryString}`);
    
    if (!res.ok) {
      console.error("Search API error:", res.status, res.statusText);
      const errorData = await res.json().catch(() => ({}));
      console.error("Error details:", errorData);
      throw new Error(`Search failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Pastikan data.data adalah array
    if (!data || !data.data) {
      console.warn("Search returned invalid data structure:", data);
      return [];
    }
    
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Error in searchEmails:", error);
    throw error;
  }
}

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

const getTanggalSuratLocal = (item: DynamicEmailData) => {
  return getTanggalSurat(item) || item.surat_jalan.createdAt;
};


export default function SearchResultPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const searchTypeParam =
    (searchParams.get("type") as SearchType) || "semua";
  const categoriesParam = searchParams.get("categories") || "";
  const selectedCategories = categoriesParam ? categoriesParam.split(",") : [];

  const [results, setResults] = useState<DynamicEmailData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>(query);
  const [searchType, setSearchType] = useState<SearchType>(searchTypeParam);
  const [openedEmail, setOpenedEmail] = useState<DynamicEmailData | null>(null);
  const { user } = useUserLogin();

  // Get available search types based on role
  const getAvailableSearchTypes = () => {
    const userRole = user?.role?.name;

    if (userRole === "Admin") {
      return [
        { value: "semua" as SearchType, label: "Semua" },
        { value: "no_surat" as SearchType, label: "No. Surat" },
        { value: "material" as SearchType, label: "Nama Material" },
      ];
    } else if (userRole === "Vendor" || userRole === "Gardu Induk") {
      return [
        { value: "semua" as SearchType, label: "Semua" },
        { value: "no_surat" as SearchType, label: "No. Berita Acara" },
        { value: "material" as SearchType, label: "Nama Material" },
        { value: "vendor" as SearchType, label: "Nama Vendor" },
      ];
    } else if (userRole === "Spv") {
      return [
        { value: "semua" as SearchType, label: "Semua" },
        { value: "no_surat" as SearchType, label: "No. Surat" },
        { value: "material" as SearchType, label: "Nama Material" },
        { value: "vendor" as SearchType, label: "Nama Vendor" },
      ];
    }

    return [
      { value: "semua" as SearchType, label: "Semua" },
      { value: "no_surat" as SearchType, label: "No. Surat" },
    ];
  };

  const availableSearchTypes = getAvailableSearchTypes();

  // Get available categories based on user role (same logic as header)
  const getAvailableCategories = () => {
    const userRole = user?.role?.name;

    if (userRole === "Admin") {
      return [
        { value: "Surat Jalan", label: "Surat Jalan" },
        {
          value: "Berita Acara Pemeriksaan Tim Mutu",
          label: "Berita Acara Pemeriksaan Tim Mutu",
        },
      ];
    } else if (userRole === "Spv") {
      return [
        { value: "Surat Jalan", label: "Surat Jalan" },
        {
          value: "Berita Acara Material Bongkaran",
          label: "Berita Acara Material Bongkaran",
        },
        {
          value: "Berita Acara Pemeriksaan Tim Mutu",
          label: "Berita Acara Pemeriksaan Tim Mutu",
        },
      ];
    } else if (userRole === "Vendor" || userRole === "Gardu Induk") {
      // Vendor dan Gardu Induk tidak memerlukan filter (otomatis Berita Acara Material Bongkaran)
      return [];
    }

    return [];
  };

  const availableCategories = getAvailableCategories();
  const showFilter = availableCategories.length > 0;

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchInput(query);
    setSearchType(searchTypeParam);
  }, [query, searchTypeParam]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || !user?.role?.name) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data: DynamicEmailData[] = await searchEmails(
          query,
          searchType,
          user.role.name
        );

        // Pastikan data adalah array, jika null/undefined gunakan array kosong
        const emailData = Array.isArray(data) ? data : [];

        // Filter berdasarkan status_entry untuk Spv
        let filteredData =
          user?.role?.name === "Spv"
            ? emailData.filter((item) => {
                const suratJalan = item.surat_jalan;
                return suratJalan?.status_entry !== "Draft";
              })
            : emailData;

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
  }, [query, searchType, categoriesParam, user?.role?.name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const params = new URLSearchParams();
      params.set("q", searchInput.trim());
      params.set("type", searchType);
      // Include selected categories if any
      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      } else if (categoriesParam) {
        params.set("categories", categoriesParam);
      }
      window.location.href = `/search?${params.toString()}`;
    }
  };

  // Handle search type change (preserve filters)
  const handleSearchTypeChange = (newSearchType: SearchType) => {
    const params = new URLSearchParams();
    params.set("q", query || searchInput.trim());
    params.set("type", newSearchType);
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    window.location.href = `/search?${params.toString()}`;
  };

  // Handle category toggle
  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    
    const params = new URLSearchParams();
    params.set("q", query || searchInput.trim());
    params.set("type", searchType);
    if (newCategories.length > 0) {
      params.set("categories", newCategories.join(","));
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleRemoveCategory = (category: string) => {
    const newCategories = selectedCategories.filter((c) => c !== category);
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("type", searchType);
    if (newCategories.length > 0) {
      params.set("categories", newCategories.join(","));
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("type", searchType);
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
      "Berita Acara Material Bongkaran":
        "bg-purple-100 text-purple-700 border-purple-200",
      "Berita Acara Pemeriksaan Tim Mutu":
        "bg-green-100 text-green-700 border-green-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleEmailClick = async (email: DynamicEmailData): Promise<void> => {
    setOpenedEmail(email);
  };

  const handleCloseDetail = (): void => {
    setOpenedEmail(null);
  };

  const getSearchPlaceholder = () => {
    const selected = availableSearchTypes.find((t) => t.value === searchType);
    if (searchType === "semua") {
      return "Cari di semua field...";
    }
    return `Cari berdasarkan ${selected?.label || "No. Surat"}...`;
  };

  return (
    <div className=" min-h-screen bg-gray-50">
      {/* Header Search Bar */}
      <div className="bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0056B0] mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Kembali Ke Inbox</span>
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            {/* Search Type Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Filter size={16} className="text-gray-500 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                Cari berdasarkan:
              </span>
              {availableSearchTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleSearchTypeChange(type.value)}
                  className={`text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    searchType === type.value
                      ? "bg-[#0056B0] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#F6F9FF] rounded-xl px-3 sm:px-6 py-3 sm:py-4 border-2 border-[#0056B0]/20 focus-within:border-[#0056B0] transition-colors">
              <Search size={20} className="text-[#0056B0] flex-shrink-0 sm:w-6 sm:h-6" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 min-w-0 text-gray-700 placeholder-gray-500 text-sm sm:text-lg"
                autoFocus
              />

              {/* Filter Dropdown - Only show if user has available categories */}
              {showFilter && (
                <>
                  <div className="h-6 sm:h-8 w-px bg-[#0056B0] mx-1 sm:mx-2 flex-shrink-0"></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-[#0056B0] transition-colors relative flex-shrink-0"
                      >
                        <SlidersVertical size={20} className="sm:w-6 sm:h-6" />
                        {/* Badge untuk active filters */}
                        {selectedCategories.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#0056B0] text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-semibold text-[10px] sm:text-xs">
                            {selectedCategories.length}
                          </span>
                        )}
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        Filter berdasarkan Kategori
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {availableCategories.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category.value}
                          checked={selectedCategories.includes(
                            category.value
                          )}
                          onCheckedChange={() =>
                            handleCategoryToggle(category.value)
                          }
                          className="cursor-pointer"
                        >
                          {category.label}
                        </DropdownMenuCheckboxItem>
                      ))}

                      {selectedCategories.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleClearAllFilters}
                            className="text-red-500 hover:text-red-600 cursor-pointer justify-center font-medium"
                          >
                            Hapus Filter
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              <button
                type="submit"
                className="bg-[#0056B0] text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-[#004494] transition-colors font-medium text-sm sm:text-base flex-shrink-0 whitespace-nowrap"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Active Filters */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                Filter berdasarkan:
              </span>
              {selectedCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 sm:gap-2 bg-[#0056B0] text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{category}</span>
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors flex-shrink-0"
                    type="button"
                  >
                    <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearAllFilters}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium underline whitespace-nowrap"
                type="button"
              >
                Hapus semua filter
              </button>
            </div>
          )}

          {/* Search Info */}
          {query && (
            <p className="mt-4 text-xs sm:text-sm text-gray-600 break-words">
              Menampilkan hasil untuk:{" "}
              <span className="font-semibold text-gray-900">"{query}"</span>
              <span className="text-gray-500">
                {" "}
                berdasarkan{" "}
                {
                  availableSearchTypes.find((t) => t.value === searchType)
                    ?.label
                }
              </span>
              {selectedCategories.length > 0 && (
                <span className="text-gray-500">
                  {" "}
                  di {selectedCategories.join(", ")}
                </span>
              )}
              {!loading && (
                <span className="ml-1 sm:ml-2 block sm:inline">
                  ({results?.length} hasil{results?.length !== 1 ? "" : ""}{" "}
                  ditemukan)
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
            className={`${
              openedEmail ? "hidden" : "w-full"
            } transition-all duration-300`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B0]"></div>
                <p className="mt-4 text-gray-600">Mencari...</p>
              </div>
            ) : !query ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Mulai Pencarian
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Masukkan kriteria pencarian di atas untuk menemukan dokumen
                </p>
              </div>
            ) : results?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileText size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Tidak Ada Hasil Ditemukan
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {selectedCategories.length > 0 ? (
                    <>
                      Tidak dapat menemukan dokumen yang cocok dengan "{query}" di{" "}
                      {selectedCategories.join(", ")}. Coba hapus filter atau
                      gunakan kriteria pencarian yang berbeda.
                    </>
                  ) : (
                    <>
                      Tidak dapat menemukan dokumen yang cocok dengan "{query}". Coba
                      gunakan kriteria pencarian yang berbeda.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((email) => {
                  const isOpened = openedEmail?.id === email.id;
                  const suratNumber = getNoSurat(email);
                  const isVendor = isVendorEmailData(email);

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
                              {suratNumber} 
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
                            {getPerihal(email) || "Tidak ada subjek"}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-gray-500">Tanggal:</span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(getTanggalSuratLocal(email)) || "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-500">Lokasi Asal:</span>
                          <span className="text-gray-900 font-medium">
                            {email.sender?.name || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-gray-500">Lokasi Tujuan:</span>
                          <span className="text-gray-900 font-medium">
                            {email.surat_jalan?.lokasi_asal || "-"}
                          </span>
                        </div>

                        {isVendor && email.surat_jalan.mengetahui && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 size={16} className="text-gray-400" />
                            <span className="text-gray-500">Vendor:</span>
                            <span className="text-gray-900 font-medium">
                              {email.surat_jalan.mengetahui.departemen_mengetahui ||
                                "-"}
                            </span>
                          </div>
                        )}

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
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <FileText size={16} className="text-gray-400" />
                            <span>
                              Terdapat {email.surat_jalan.materials.length} material  
                            </span>
                          </div>
                        )}

                      {/* Action Button */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEmailClick(email)}
                          className="px-4 py-2 bg-[#0056B0] text-white rounded-lg hover:bg-[#004494] transition-colors font-medium text-sm"
                        >
                          Lihat Detail
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
            <div className="w-full h-full overflow-hidden">
              {openedEmail.surat_jalan.kategori_surat === "Surat Jalan" ? (
                <EmailDetail
                  email={openedEmail as EmailDataAdmin}
                  handleCloseDetail={handleCloseDetail}
                  isSend={true}
                />
              ) : openedEmail.surat_jalan.kategori_surat ===
                "Berita Acara Material Bongkaran" ? (
                <EmailDetailBeritaBongkaran
                  email={openedEmail as EmailDataVendor}
                  handleCloseDetail={handleCloseDetail}
                  isSend={true}
                />
              ) : openedEmail.surat_jalan.kategori_surat ===
                "Berita Acara Pemeriksaan Tim Mutu" ? (
                <EmailDetailBeritaPemeriksaan
                  email={openedEmail as EmailDataOther}
                  handleCloseDetail={handleCloseDetail}
                  isSend={true}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}