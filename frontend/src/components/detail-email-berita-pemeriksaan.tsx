"use client";

import { MouseEventHandler, useEffect, useState } from "react";
import Image from "next/image";
import { Star, X, Printer, Download, Paperclip } from "lucide-react";
import {
  EmailDataOther,
  FileAttachment,
  BeritaPemeriksaan,
} from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Button } from "./ui/button";
import Link from "next/link";
import { toast } from "sonner";

const formatDate = (dateString: string) => {
  if (!dateString) return "31 Januari 2025";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateWithDay = (dateString: string) => {
  if (!dateString) return "Senin, 31 Januari 2025";
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
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

// Helper function untuk parse kelengkapan dokumen dari markdown
const parseKelengkapanFromMarkdown = (markdown: string): string[] => {
  if (!markdown) return [];

  const lines = markdown.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const trimmed = line.trim();
    return trimmed;
  });
};

// Helper function untuk get file URL
const getFileUrl = (
  fileAttachment: FileAttachment | null | undefined,
  apiUrl: string,
): string => {
  if (!fileAttachment?.url) return "";
  if (fileAttachment.url.startsWith("http")) return fileAttachment.url;
  return `${apiUrl}${fileAttachment.url}`;
};

export const EmailDetailBeritaPemeriksaan = ({
  email,
  isSend,
  isCanceled,
  handleCloseDetail,
  markEmailAsBookmarked,
}: {
  email: EmailDataOther;
  isSend?: boolean;
  isCanceled?: boolean;
  handleCloseDetail: MouseEventHandler;
  markEmailAsBookmarked?: (id: string) => void;
}) => {
  const { user } = useUserLogin();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [localEmail, setLocalEmail] = useState<EmailDataOther>(email);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const [showMobilePrintDialog, setShowMobilePrintDialog] = useState(false);

  const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  // Sync localEmail dengan prop email saat email berubah
  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

  // Handler untuk bookmark dengan optimistic update
  const handleBookmark = () => {
    if (!markEmailAsBookmarked) return;

    // Optimistic update: langsung update localEmail
    setLocalEmail((prevEmail) => ({
      ...prevEmail,
      email_statuses: prevEmail.email_statuses?.map((status) => {
        if (status.user.name === user?.name) {
          return {
            ...status,
            is_bookmarked: !status.is_bookmarked,
          };
        }
        return status;
      }),
    }));

    // Panggil fungsi dari parent untuk update backend dan emailList
    markEmailAsBookmarked(email.documentId);
  };

  const beritaPemeriksaan: BeritaPemeriksaan = email.surat_jalan;

  const getLampiranImages = () => {
    const beritaPemeriksaan = email.surat_jalan as any;
    const hasLampiran =
      "lampiran" in beritaPemeriksaan &&
      beritaPemeriksaan.lampiran &&
      Array.isArray(beritaPemeriksaan.lampiran) &&
      beritaPemeriksaan.lampiran.length > 0;

    if (!hasLampiran) return [];

    const lampiran = beritaPemeriksaan.lampiran as FileAttachment[];
    // Filter hanya image files
    return lampiran.filter((att) => {
      const ext = att.name.split(".").pop()?.toLowerCase() || "";
      return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    });
  };

  // Parse kelengkapan dokumen
  const kelengkapanDokumen = parseKelengkapanFromMarkdown(
    beritaPemeriksaan.kelengkapan_dokumen || "",
  );

  // Check if materials <= 3 for compact spacing
  const isCompactMode = beritaPemeriksaan.materials.length <= 3;

  // Split materials into pages dengan logic yang sama dengan preview
  const splitMaterialsIntoPages = () => {
    const totalMaterials = beritaPemeriksaan.materials.length;
    const kelengkapanCount = kelengkapanDokumen.length;

    // Logika break page:
    // - Jika kelengkapan <= 2: tetap satu halaman kecuali material >= 4
    // - Jika kelengkapan > 2: break page jika material >= 2

    let shouldBreakPage = false;
    let materialsThreshold = 3;

    if (kelengkapanCount <= 2) {
      // Kelengkapan sedikit: bisa muat lebih banyak material di satu halaman
      materialsThreshold = 3; // Tetap satu halaman jika material <= 3
      shouldBreakPage = totalMaterials > materialsThreshold;
    } else {
      // Kelengkapan banyak (> 2): break page jika material >= 2
      materialsThreshold = 1; // Break jika material >= 2
      shouldBreakPage = totalMaterials >= 2;
    }

    // Jika tidak perlu break page, semua dalam satu halaman
    if (!shouldBreakPage) {
      return [
        {
          materials: beritaPemeriksaan.materials,
          showIntro: true,
          showKelengkapan: true,
          showClosing: true,
          showSignature: true,
          isFirstPage: true,
          isLastPage: true,
        },
      ];
    }

    // Jika perlu break page, mulai split
    const pages = [];
    let remainingMaterials = [...beritaPemeriksaan.materials];

    // Tentukan berapa material di halaman pertama
    let materialsFirstPage = 2;
    if (kelengkapanCount <= 2) {
      materialsFirstPage = 3; // Lebih banyak material jika kelengkapan sedikit
    } else if (kelengkapanCount <= 5) {
      materialsFirstPage = 2;
    } else if (kelengkapanCount <= 10) {
      materialsFirstPage = 2; // Kelengkapan banyak, material sedikit di halaman 1
    } else {
      materialsFirstPage = 1; // Kelengkapan sangat banyak (> 10), hanya 1 material di halaman 1
    }

    // Halaman pertama
    const firstPageMaterials = remainingMaterials.slice(0, materialsFirstPage);
    remainingMaterials = remainingMaterials.slice(materialsFirstPage);

    pages.push({
      materials: firstPageMaterials,
      showIntro: true,
      showKelengkapan: true,
      showClosing: false,
      showSignature: false,
      isFirstPage: true,
      isLastPage: false,
    });

    // Halaman tengah - 4 materials per halaman
    const MATERIALS_PER_MIDDLE_PAGE = 4;
    while (remainingMaterials.length > MATERIALS_PER_MIDDLE_PAGE) {
      const nextPageMaterials = remainingMaterials.slice(
        0,
        MATERIALS_PER_MIDDLE_PAGE,
      );
      pages.push({
        materials: nextPageMaterials,
        showIntro: false,
        showKelengkapan: false,
        showClosing: false,
        showSignature: false,
        isFirstPage: false,
        isLastPage: false,
      });
      remainingMaterials = remainingMaterials.slice(MATERIALS_PER_MIDDLE_PAGE);
    }

    // Halaman terakhir - sisa materials + closing + signature
    if (remainingMaterials.length > 0) {
      pages.push({
        materials: remainingMaterials,
        showIntro: false,
        showKelengkapan: false,
        showClosing: true,
        showSignature: true,
        isFirstPage: false,
        isLastPage: true,
      });
    } else {
      // Jika tidak ada sisa material, tambahkan halaman baru untuk closing + signature
      pages.push({
        materials: [],
        showIntro: false,
        showKelengkapan: false,
        showClosing: true,
        showSignature: true,
        isFirstPage: false,
        isLastPage: true,
      });
    }

    return pages;
  };

  const materialPages = splitMaterialsIntoPages();

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

  const handleDownloadAttachment = async (
    fileUrl: string,
    fileName: string,
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

  useEffect(() => {
    if (!isGeneratingPDF) return;

    let toastId: string | number;

    const generatePDF = async () => {
      toastId = toast.loading("Generating PDF...", {
        position: "top-center",
      });

      // Tunggu lebih lama untuk memastikan semua gambar ter-render
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const hiddenContent = document.getElementById(
        "hidden-preview-content-berita",
      );
      const pages = hiddenContent
        ? hiddenContent.querySelectorAll(".surat-berita-pemeriksaan")
        : document.querySelectorAll(".surat-berita-pemeriksaan");

      if (!pages.length) {
        console.error("Preview element tidak ditemukan!");
        toast.dismiss(toastId);
        toast.error("Gagal generate PDF. Preview element tidak ditemukan!", {
          position: "top-center",
        });
        setIsGeneratingPDF(false);
        return;
      }

      try {
        // Deteksi mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Preload semua gambar lampiran sebelum generate PDF
        const imageLampiran = getLampiranImages();
        if (imageLampiran.length > 0) {
          const imagePromises = imageLampiran.map(
            (attachment: FileAttachment) => {
              return new Promise<void>((resolve) => {
                const img = document.createElement("img") as HTMLImageElement;
                img.crossOrigin = "anonymous";

                const imageUrl = attachment.url.startsWith("http")
                  ? attachment.url
                  : `${apiUrl}${attachment.url}`;

                img.onload = () => resolve();
                img.onerror = () => {
                  console.warn(`Failed to load image: ${imageUrl}`);
                  resolve(); // Resolve anyway to not block PDF generation
                };

                img.src = imageUrl;
              });
            },
          );

          // Wait for all images to load
          await Promise.all(imagePromises);

          // Extra delay after images loaded
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          // Reset transform sebelum capture
          page.style.transform = "";
          page.style.transformOrigin = "";

          // Gunakan scale yang lebih tinggi untuk kualitas lebih baik
          const scale = isMobile ? 3 : 2.5;

          const canvas = await html2canvas(page, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            imageTimeout: 15000,
            windowWidth: 794,
            windowHeight: 1123,
            width: 794,
            height: 1123,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
              // Pastikan semua gambar di cloned document sudah loaded
              const images = clonedDoc.querySelectorAll("img");
              images.forEach((img) => {
                const imgElement = img as HTMLImageElement;
                imgElement.loading = "eager";
                imgElement.decoding = "sync";
              });
            },
          });

          const imgData = canvas.toDataURL("image/png", 1.0);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          if (i > 0) pdf.addPage();
          pdf.addImage(
            imgData,
            "PNG",
            0,
            0,
            pageWidth,
            pageHeight,
            undefined,
            "FAST",
          );
        }

        pdf.save(
          `${
            beritaPemeriksaan.no_berita_acara || "berita-acara-pemeriksaan"
          }.pdf`,
        );

        toast.dismiss(toastId);
        toast.success("PDF generated successfully!", {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.dismiss(toastId);
        toast.error("Gagal generate PDF. Silakan coba lagi.", {
          position: "top-center",
        });
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    generatePDF();
  }, [isGeneratingPDF, beritaPemeriksaan.no_berita_acara, apiUrl]);

  // Fungsi untuk memastikan semua gambar sudah load
  const waitForImagesToLoad = (): Promise<void> => {
    return new Promise((resolve) => {
      // Tunggu DOM update dulu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Tunggu sedikit lagi untuk memastikan React sudah render semua
          setTimeout(() => {
            const printContent = document.getElementById(
              "print-content-berita-pemeriksaan",
            );
            if (!printContent) {
              resolve();
              return;
            }

            // Cari semua gambar di print content
            const images = Array.from(
              printContent.querySelectorAll("img"),
            ) as HTMLImageElement[];

            if (images.length === 0) {
              resolve();
              return;
            }

            let loadedCount = 0;
            const totalImages = images.length;
            let resolved = false;

            const checkComplete = () => {
              if (resolved) return;

              loadedCount++;
              if (loadedCount === totalImages) {
                resolved = true;
                // Tambahkan delay kecil untuk memastikan render selesai
                setTimeout(() => {
                  resolve();
                }, 300);
              }
            };

            // Set timeout untuk mencegah hang jika ada gambar yang tidak load
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                console.warn("Some images failed to load within timeout");
                resolve();
              }
            }, 10000);

            images.forEach((img, index) => {
              // Pastikan gambar tidak lazy load dan force eager loading
              img.loading = "eager";
              img.decoding = "sync";

              const imagePromise = new Promise<void>((imgResolve) => {
                // Jika gambar sudah complete dan memiliki dimensi, langsung resolve
                if (
                  img.complete &&
                  img.naturalHeight !== 0 &&
                  img.naturalWidth !== 0
                ) {
                  imgResolve();
                } else {
                  // Tambahkan event listener untuk load dan error
                  const onLoad = () => {
                    img.removeEventListener("load", onLoad);
                    img.removeEventListener("error", onError);
                    imgResolve();
                  };

                  const onError = () => {
                    img.removeEventListener("load", onLoad);
                    img.removeEventListener("error", onError);
                    console.warn(`Image ${index} failed to load:`, img.src);
                    imgResolve(); // Resolve anyway untuk tidak block
                  };

                  img.addEventListener("load", onLoad, { once: true });
                  img.addEventListener("error", onError, { once: true });

                  // Force reload jika src sudah ada tapi belum load
                  if (img.src && !img.complete) {
                    const currentSrc = img.src;
                    // Hapus dan set ulang src untuk force reload
                    img.src = "";
                    setTimeout(() => {
                      img.src = currentSrc;
                    }, 10);
                  }
                }
              });

              imagePromise.then(() => {
                checkComplete();
              });
            });
          }, 100);
        });
      });
    });
  };

  const handlePrintClick = () => {
    if (isMobileDevice()) {
      setShowMobilePrintDialog(true);
      return;
    }
    handleDesktopPrint();
  };

  const handleDesktopPrint = async () => {
    setIsPrinting(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await waitForImagesToLoad();

    window.print();

    const handleAfterPrint = () => {
      setIsPrinting(false);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  const handleMobilePrintPreview = async () => {
    setShowMobilePrintDialog(false);
    await handleDesktopPrint();
  };

  const handleMobileDownloadPDF = () => {
    setShowMobilePrintDialog(false);
    setIsGeneratingPDF(true);
  };

  return (
    <>
      <div className="plus-jakarta-sans h-full bg-white rounded-xl w-full shadow-md py-6 px-4 max-w-full overflow-y-auto">
        {/* Header */}
        {isSend || isCanceled ? (
          <>
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <h2 className="font-bold text-[#191919] text-base sm:text-lg md:text-2xl">
                  {beritaPemeriksaan.perihal_kontrak}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  {!isCanceled ? (
                    <></>
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
                    beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "",
                  ) || "GA"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name,
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
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
                    beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "",
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-[#191919]">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7F7F7F]">
                    to:{" "}
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                <button
                  onClick={handleBookmark}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Toggle bookmark"
                >
                  <Star
                    className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer transition-colors duration-200 ${
                      localEmail.email_statuses?.find(
                        (item) => item.user.name === user?.name,
                      )?.is_bookmarked
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button onClick={handlePrintClick}>
                  <Printer className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-gray-600" />
                </button>
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
                  {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                </h2>
              </div>
            </div>
          </>
        )}

        {/* Email Content */}
        <div className="inter mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#191919]">
              {beritaPemeriksaan.no_berita_acara || "(NO Berita Acara)"}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#7F7F7F]">
              {formatDateTimeEN(
                beritaPemeriksaan.tanggal_pelaksanaan ||
                  beritaPemeriksaan.tanggal_kontrak ||
                  beritaPemeriksaan.createdAt,
              )}
            </span>
          </div>
          <p className="text-[#181818] text-xs sm:text-sm md:text-base">
            {email.pesan || ""}
          </p>
        </div>

        <hr className="border-t-4 border-gray-800 mb-6" />

        {/* Document Preview */}
        <div
          className="mb-6 md:mb-8 w-full flex justify-center"
          style={{ height: "auto" }}
        >
          <div className="w-80 sm:w-[210mm] scale-[0.38] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 transform origin-top-left">
            <div className="bg-white py-4" style={{ width: "210mm" }}>
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
                </div>
              </div>

              <hr className="border-t-2 border-gray-800 mb-4" />

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  BERITA ACARA
                </h1>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  HASIL PEMERIKSAAN MUTU BARANG
                </h1>
                <div className="text-blue-600 font-bold text-2xl">
                  {beritaPemeriksaan.no_berita_acara || "(No Berita Acara)"}
                </div>
              </div>

              {/* Introduction */}
              <div className="mb-6 text-lg text-justify">
                <p className="mb-2">
                  Pada hari{" "}
                  <span className="font-semibold">
                    {formatDateWithDay(
                      beritaPemeriksaan.tanggal_pelaksanaan ||
                        beritaPemeriksaan.tanggal_kontrak ||
                        beritaPemeriksaan.createdAt,
                    )}
                  </span>{" "}
                  kami yang bertanda tangan di bawah ini telah bersama - sama
                  melaksanakan pemeriksaan terhadap barang sesuai dengan Kontrak
                  Rinci{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.no_perjanjian_kontrak || "(No Kontrak)"}
                  </span>{" "}
                  tanggal{" "}
                  <span className="font-semibold">
                    {formatDate(beritaPemeriksaan.tanggal_kontrak)}
                  </span>{" "}
                  perihal{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                  </span>
                  .
                </p>
                <p className="">
                  Sesuai dengan lembar kerja pemeriksaan dokumen tim pemeriksa
                  mutu barang. Adapun hasil dari pemeriksaan{" "}
                  <span className="font-semibold">
                    {beritaPemeriksaan.perihal_kontrak || "(Perihal Kontrak)"}
                  </span>{" "}
                  dapat diterima /{" "}
                  <span className="line-through">tidak diterima</span> dengan
                  kelengkapan dokumen sebagai berikut:
                </p>
              </div>

              {/* Kelengkapan Dokumen */}
              {kelengkapanDokumen.length > 0 && (
                <div className="mb-6 text-justify">
                  <ul className="space-y-1 text-lg ml-4">
                    {kelengkapanDokumen.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials Table */}
              <div className="mb-6 min-w-[300px] overflow-x-auto">
                <p className="text-lg mb-3">
                  Adapun hasil pemeriksaan sebagai berikut:
                </p>
                <table className="border-t border-b border-gray-300 text-sm w-full">
                  <thead className="bg-gray-100">
                    <tr className="text-lg text-center">
                      <th className="border-2 border-gray-800 px-2 py-2">
                        No.
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Material Description
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        QTY
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        SAT
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Serial Number
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    {beritaPemeriksaan.materials.map((item, index) => {
                      const material = item as any; // Type assertion untuk akses tipe, serial_number, lokasi
                      return (
                        <tr key={index}>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            <div className="text-left">
                              <div className="font-semibold">
                                {material.nama}
                              </div>
                              {material.katalog && (
                                <div className="">
                                  <span className="font-bold">MERK:</span>{" "}
                                  {material.katalog}
                                </div>
                              )}
                              {material.tipe && (
                                <div className="">
                                  <span className="font-bold">TYPE:</span>{" "}
                                  {material.tipe}
                                </div>
                              )}
                              {material.lokasi && (
                                <div className="">
                                  LOKASI: {material.lokasi}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.jumlah}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {item.satuan}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            {material.serial_number || "-"}
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            {material.keterangan || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Closing Statement */}
              <div className="mb-6 text-lg">
                <p>
                  Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                  dengan sesungguhnya untuk dapat dipergunakan sebagai mana
                  mestinya.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between mb-8 pr-4">
                {/* Penyedia Barang */}
                <div className="text-center items-center flex flex-col">
                  <div className="mb-2 text-lg font-semibold">
                    Penyedia Barang
                  </div>
                  <div className="font-bold mb-4 text-lg">
                    {beritaPemeriksaan.penyedia_barang
                      ?.perusahaan_penyedia_barang ||
                      "(Perusahaan Penyedia Barang)"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-start">
                    {beritaPemeriksaan.penyedia_barang?.ttd_penerima ? (
                      <img
                        width={200}
                        height={200}
                        src={getFileUrl(
                          beritaPemeriksaan.penyedia_barang.ttd_penerima,
                          apiUrl,
                        )}
                        alt="TTD Penyedia Barang"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">
                        (Tanda Tangan)
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold">
                    {beritaPemeriksaan.penyedia_barang?.nama_penanggung_jawab ||
                      "(Nama Penanggung Jawab)"}
                  </div>
                </div>

                {/* Pemeriksa Barang */}
                <div className="text-center items-center flex flex-col">
                  <div className="mb-2 text-lg font-semibold">
                    Pemeriksa Barang
                  </div>
                  <div className="font-bold mb-4 text-lg">
                    {beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa ||
                      "(Departemen Pemeriksa)"}
                  </div>

                  {/* List Mengetahui */}
                  {beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
                    beritaPemeriksaan.pemeriksa_barang.mengetahui.length >
                      0 && (
                      <div className="space-y-3">
                        {beritaPemeriksaan.pemeriksa_barang.mengetahui.map(
                          (mengetahui, index) => (
                            <div key={index} className="flex items-center pb-2">
                              <div className="text-base font-semibold min-w-[200px]">
                                {index + 1}{" "}
                                {mengetahui.nama_mengetahui ||
                                  "(Nama Mengetahui)"}
                              </div>
                              <div className="text-base font-semibold">:</div>
                              <div className="flex items-center ml-2">
                                <div className="w-32 h-12 flex items-center justify-center border-b-2 border-gray-800">
                                  {mengetahui.ttd_mengetahui ? (
                                    <img
                                      width={120}
                                      height={60}
                                      src={getFileUrl(
                                        mengetahui.ttd_mengetahui,
                                        apiUrl,
                                      )}
                                      alt={`TTD Mengetahui ${index + 1}`}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-gray-400 text-xs">
                                      (Tanda Tangan)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section - Tampilan berbeda dari preview */}
        {(() => {
          const imageLampiran = getLampiranImages();
          if (imageLampiran.length === 0) return null;

          return (
            <>
              <hr className="border-b-4 border-gray-800 mb-6" />

              <div className="mb-6 md:mb-8">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm md:text-base">
                  <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Lampiran ({imageLampiran.length})
                </h4>
                <div className="space-y-2">
                  {imageLampiran.map(
                    (attachment: FileAttachment, index: number) => {
                      const imageUrl = attachment.url.startsWith("http")
                        ? attachment.url
                        : `${apiUrl}${attachment.url}`;

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
                                attachment.name,
                              )
                            }
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                          </button>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* Ubah Surat Button for Reject Status */}
        {user?.role?.name === "Admin" &&
          beritaPemeriksaan.status_surat === "Reject" && (
            <Link
              href={`/create-letter/berita-acara-pemeriksaan-tim-mutu?mode=edit&id=${beritaPemeriksaan.documentId}`}
            >
              <Button variant="default" size="lg">
                Ubah Surat
              </Button>
            </Link>
          )}
      </div>

      {/* Hidden PDF Preview */}
      {isGeneratingPDF && (
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            backgroundColor: "#ffffff",
            zIndex: -1,
            width: "794px", // A4 width in pixels
          }}
        >
          <div id="hidden-preview-content-berita" style={{ width: "794px" }}>
            {materialPages.map((pageData, pageIndex) => {
              const {
                materials: pageMaterials,
                showIntro,
                showKelengkapan,
                showClosing,
                showSignature,
                isFirstPage,
                isLastPage,
              } = pageData;

              const isCompactModePage = pageMaterials.length <= 3;

              // Hitung index global untuk material numbering
              let startIndex = 0;
              for (let i = 0; i < pageIndex; i++) {
                startIndex += materialPages[i].materials.length;
              }

              return (
                <div
                  key={pageIndex}
                  className="surat-berita-pemeriksaan bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  style={{
                    width: "794px",
                    minHeight: "1123px",
                    padding: "40px 56.7px 30px 56.7px", // Top, Right, Bottom, Left - Kurangi padding bottom
                    boxSizing: "border-box",
                    whiteSpace: "normal",
                    wordSpacing: "normal",
                  }}
                >
                  {/* Company Header */}
                  <div
                    className={`flex items-center gap-4 ${
                      isCompactModePage ? "mb-3" : "mb-5"
                    }`}
                  >
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
                    </div>
                  </div>

                  <hr
                    className={`border-t-2 border-gray-800 ${
                      isCompactModePage ? "mb-2" : "mb-3"
                    }`}
                  />

                  {/* Title - only on first page */}
                  {isFirstPage && (
                    <div
                      className={`text-center ${isCompactModePage ? "mb-3" : "mb-5"}`}
                    >
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-1"
                        } font-bold text-gray-900`}
                      >
                        BERITA ACARA
                      </h1>
                      <h1
                        className={`${
                          isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-1"
                        } font-bold text-gray-900`}
                      >
                        HASIL PEMERIKSAAN MUTU BARANG
                      </h1>
                      <div
                        className={`${
                          isCompactModePage ? "text-xl" : "text-2xl"
                        } text-blue-600 font-bold`}
                      >
                        {beritaPemeriksaan.no_berita_acara ||
                          "(No Berita Acara)"}
                      </div>
                    </div>
                  )}

                  {/* Introduction - only on first page */}
                  {showIntro && (
                    <div
                      className={`${isCompactModePage ? "mb-2 text-base" : "mb-3 text-lg"} text-justify`}
                    >
                      <p className="mb-2">
                        Pada hari{" "}
                        <span className="font-semibold">
                          {formatDateWithDay(
                            beritaPemeriksaan.tanggal_pelaksanaan ||
                              beritaPemeriksaan.tanggal_kontrak ||
                              beritaPemeriksaan.createdAt,
                          )}
                        </span>{" "}
                        kami yang bertanda tangan di bawah ini telah bersama -
                        sama melaksanakan pemeriksaan terhadap barang sesuai
                        dengan Kontrak Rinci{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.no_perjanjian_kontrak ||
                            "(No Kontrak)"}
                        </span>{" "}
                        tanggal{" "}
                        <span className="font-semibold">
                          {formatDate(beritaPemeriksaan.tanggal_kontrak)}
                        </span>{" "}
                        perihal{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.perihal_kontrak ||
                            "(Perihal Kontrak)"}
                        </span>
                        .
                      </p>
                      <p className="">
                        Sesuai dengan lembar kerja pemeriksaan dokumen tim
                        pemeriksa mutu barang. Adapun hasil dari pemeriksaan{" "}
                        <span className="font-semibold">
                          {beritaPemeriksaan.perihal_kontrak ||
                            "(Perihal Kontrak)"}
                        </span>{" "}
                        dapat diterima /{" "}
                        <span className="line-through">tidak diterima</span>{" "}
                        dengan kelengkapan dokumen sebagai berikut:
                      </p>
                    </div>
                  )}

                  {/* Kelengkapan Dokumen - only on first page */}
                  {showKelengkapan && kelengkapanDokumen.length > 0 && (
                    <div
                      className={`${isCompactModePage ? "mb-2" : "mb-3"} text-justify`}
                    >
                      <ul
                        className={`space-y-1 ${
                          isCompactModePage ? "text-base" : "text-lg"
                        } ml-4`}
                      >
                        {kelengkapanDokumen.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Materials Table */}
                  {pageMaterials.length > 0 && (
                    <div
                      className={`${
                        isCompactModePage ? "mb-2" : "mb-3"
                      } min-w-[300px] overflow-x-auto`}
                      style={{ display: "block" }}
                    >
                      <p
                        className={`${
                          isCompactModePage ? "text-base mb-1" : "text-lg mb-2"
                        }`}
                      >
                        Adapun hasil pemeriksaan sebagai berikut:
                      </p>
                      <table
                        className="border-t border-b border-gray-300 text-sm w-full"
                        style={{
                          display: "table",
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead className="bg-gray-100">
                          <tr
                            className={`${
                              isCompactModePage ? "text-base" : "text-lg"
                            } text-center`}
                          >
                            <th className="border-2 border-gray-800 px-2 py-2">
                              No.
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              Material Description
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              QTY
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              SAT
                            </th>
                            <th className="border-2 border-gray-800 px-2 py-2">
                              Serial Number
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={
                            isCompactModePage ? "text-base" : "text-lg"
                          }
                        >
                          {pageMaterials.map((item, index) => {
                            const material = item as any;
                            const globalIndex = startIndex + index;
                            return (
                              <tr key={globalIndex}>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {globalIndex + 1}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  }`}
                                >
                                  <div className="text-left">
                                    <div className="font-semibold">
                                      {material.nama}
                                    </div>
                                    {material.katalog && (
                                      <div className="">
                                        <span className="font-bold">MERK:</span>{" "}
                                        {material.katalog}
                                      </div>
                                    )}
                                    {material.tipe && (
                                      <div className="">
                                        <span className="font-bold">TYPE:</span>{" "}
                                        {material.tipe}
                                      </div>
                                    )}
                                    {material.lokasi && (
                                      <div className="">
                                        LOKASI: {material.lokasi}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {item.jumlah}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } text-center`}
                                >
                                  {item.satuan}
                                </td>
                                <td
                                  className={`border-2 border-gray-800 px-2 ${
                                    isCompactModePage ? "py-1" : "py-2"
                                  } `}
                                >
                                  {material.serial_number || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Closing Statement - only on last page */}
                  {showClosing && (
                    <div
                      className={`${isCompactModePage ? "mb-2" : "mb-3"} ${
                        isCompactModePage ? "text-base" : "text-lg"
                      }`}
                    >
                      <p>
                        Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                        dengan sesungguhnya untuk dapat dipergunakan sebagai
                        mana mestinya.
                      </p>
                    </div>
                  )}

                  {/* Signatures - only on last page */}
                  {showSignature && (
                    <div
                      className={`flex justify-between ${isCompactModePage ? "mb-2" : "mb-3"}`}
                    >
                      {/* Penyedia Barang */}
                      <div className="text-center items-center flex flex-col">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Penyedia Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-3"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {beritaPemeriksaan.penyedia_barang
                            ?.perusahaan_penyedia_barang ||
                            "(Perusahaan Penyedia Barang)"}
                        </div>

                        {/* Signature Preview */}
                        <div
                          className={`${
                            isCompactModePage ? "h-14 mb-2" : "h-16 mb-3"
                          } flex items-center justify-start`}
                        >
                          {beritaPemeriksaan.penyedia_barang?.ttd_penerima ? (
                            <img
                              width={200}
                              height={200}
                              src={getFileUrl(
                                beritaPemeriksaan.penyedia_barang.ttd_penerima,
                                apiUrl,
                              )}
                              alt="TTD Penyedia Barang"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-sm">
                              (Tanda Tangan)
                            </div>
                          )}
                        </div>

                        <div
                          className={`${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-bold`}
                        >
                          {beritaPemeriksaan.penyedia_barang
                            ?.nama_penanggung_jawab ||
                            "(Nama Penanggung Jawab)"}
                        </div>
                      </div>

                      {/* Pemeriksa Barang */}
                      <div className="text-center items-center flex flex-col">
                        <div
                          className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          } font-semibold`}
                        >
                          Pemeriksa Barang
                        </div>
                        <div
                          className={`font-bold ${isCompactModePage ? "mb-2" : "mb-3"} ${
                            isCompactModePage ? "text-base" : "text-lg"
                          }`}
                        >
                          {beritaPemeriksaan.pemeriksa_barang
                            ?.departemen_pemeriksa || "(Departemen Pemeriksa)"}
                        </div>

                        {/* List Mengetahui */}
                        {beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
                          beritaPemeriksaan.pemeriksa_barang.mengetahui.length >
                            0 && (
                            <div
                              className={
                                isCompactModePage ? "space-y-1" : "space-y-2"
                              }
                            >
                              {beritaPemeriksaan.pemeriksa_barang.mengetahui.map(
                                (mengetahui, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center ${
                                      isCompactModePage ? "pb-1" : "pb-1"
                                    }`}
                                  >
                                    <div
                                      className={`${
                                        isCompactModePage
                                          ? "text-sm"
                                          : "text-base"
                                      } font-semibold min-w-[200px]`}
                                    >
                                      {index + 1}{" "}
                                      {mengetahui.nama_mengetahui ||
                                        "(Nama Mengetahui)"}
                                    </div>
                                    <div
                                      className={`${
                                        isCompactModePage
                                          ? "text-sm"
                                          : "text-base"
                                      } font-semibold`}
                                    >
                                      :
                                    </div>
                                    <div className="flex items-center ml-2">
                                      <div
                                        className={`${
                                          isCompactModePage
                                            ? "w-24 h-9"
                                            : "w-28 h-10"
                                        } flex items-center justify-center border-b-2 border-gray-800`}
                                      >
                                        {mengetahui.ttd_mengetahui ? (
                                          <img
                                            width={120}
                                            height={60}
                                            src={getFileUrl(
                                              mengetahui.ttd_mengetahui,
                                              apiUrl,
                                            )}
                                            alt={`TTD Mengetahui ${index + 1}`}
                                            className="max-h-full max-w-full object-contain"
                                          />
                                        ) : (
                                          <div className="text-gray-400 text-xs">
                                            (Tanda Tangan)
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(() => {
              const imageLampiran = getLampiranImages();
              if (imageLampiran.length === 0) return null;

              return (
                <div
                  key="lampiran-page-pdf"
                  className="surat-berita-pemeriksaan bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  style={{
                    width: "794px",
                    minHeight: "1123px",
                    padding: "40px 56.7px 30px 56.7px",
                    boxSizing: "border-box",
                    whiteSpace: "normal",
                    wordSpacing: "normal",
                  }}
                >
                  {/* Company Header */}
                  <div className="flex items-center gap-4 mb-3">
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
                    </div>
                  </div>

                  <hr className="border-t-2 border-gray-800 mb-2" />

                  {/* Grid Lampiran - 3 kolom */}
                  <div
                    className="grid grid-cols-3 gap-4"
                    style={{ maxHeight: "calc(100% - 200px)" }}
                  >
                    {imageLampiran.map(
                      (attachment: FileAttachment, index: number) => {
                        const imageUrl = attachment.url.startsWith("http")
                          ? attachment.url
                          : `${apiUrl}${attachment.url}`;

                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center justify-start"
                          >
                            <div className="w-full aspect-square flex items-center justify-center overflow-hidden mb-2">
                              <img
                                src={imageUrl}
                                alt={`Lampiran ${index + 1}`}
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Print Content - Hidden until printing */}
      {isPrinting && (
        <div id="print-content-berita-pemeriksaan" className="print-only">
          {materialPages.map((pageData, pageIndex) => {
            const {
              materials: pageMaterials,
              showIntro,
              showKelengkapan,
              showClosing,
              showSignature,
              isFirstPage,
              isLastPage,
            } = pageData;

            const isCompactModePage = pageMaterials.length <= 3;

            // Hitung index global untuk material numbering
            let startIndex = 0;
            for (let i = 0; i < pageIndex; i++) {
              startIndex += materialPages[i].materials.length;
            }

            return (
              <div
                key={pageIndex}
                className="surat-print w-[210mm] h-[297mm] bg-white mx-auto my-0 flex flex-col"
                style={{
                  padding: "10mm 10mm 10mm 10mm",
                  boxSizing: "border-box",
                  pageBreakAfter: "always",
                  pageBreakInside: "avoid",
                }}
              >
                {/* Company Header */}
                <div
                  className={`flex items-center gap-4 ${
                    isCompactModePage ? "mb-4" : "mb-6"
                  }`}
                >
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
                  </div>
                </div>

                <hr
                  className={`border-t-2 border-gray-800 ${
                    isCompactModePage ? "mb-3" : "mb-4"
                  }`}
                />

                {/* Title - only on first page */}
                {isFirstPage && (
                  <div
                    className={`text-center ${isCompactModePage ? "mb-4" : "mb-6"}`}
                  >
                    <h1
                      className={`${
                        isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-2"
                      } font-bold text-gray-900`}
                    >
                      BERITA ACARA
                    </h1>
                    <h1
                      className={`${
                        isCompactModePage ? "text-2xl mb-1" : "text-3xl mb-2"
                      } font-bold text-gray-900`}
                    >
                      HASIL PEMERIKSAAN MUTU BARANG
                    </h1>
                    <div
                      className={`${
                        isCompactModePage ? "text-xl" : "text-2xl"
                      } text-blue-600 font-bold`}
                    >
                      {beritaPemeriksaan.no_berita_acara || "(No Berita Acara)"}
                    </div>
                  </div>
                )}

                {/* Introduction - only on first page */}
                {showIntro && (
                  <div
                    className={`${isCompactModePage ? "mb-3 text-base" : "mb-4 text-lg"} text-justify`}
                  >
                    <p className="mb-2">
                      Pada hari{" "}
                      <span className="font-semibold">
                        {formatDateWithDay(
                          beritaPemeriksaan.tanggal_pelaksanaan ||
                            beritaPemeriksaan.tanggal_kontrak ||
                            beritaPemeriksaan.createdAt,
                        )}
                      </span>{" "}
                      kami yang bertanda tangan di bawah ini telah bersama -
                      sama melaksanakan pemeriksaan terhadap barang sesuai
                      dengan Kontrak Rinci{" "}
                      <span className="font-semibold">
                        {beritaPemeriksaan.no_perjanjian_kontrak ||
                          "(No Kontrak)"}
                      </span>{" "}
                      tanggal{" "}
                      <span className="font-semibold">
                        {formatDate(beritaPemeriksaan.tanggal_kontrak)}
                      </span>{" "}
                      perihal{" "}
                      <span className="font-semibold">
                        {beritaPemeriksaan.perihal_kontrak ||
                          "(Perihal Kontrak)"}
                      </span>
                      .
                    </p>
                    <p className="">
                      Sesuai dengan lembar kerja pemeriksaan dokumen tim
                      pemeriksa mutu barang. Adapun hasil dari pemeriksaan{" "}
                      <span className="font-semibold">
                        {beritaPemeriksaan.perihal_kontrak ||
                          "(Perihal Kontrak)"}
                      </span>{" "}
                      dapat diterima /{" "}
                      <span className="line-through">tidak diterima</span>{" "}
                      dengan kelengkapan dokumen sebagai berikut:
                    </p>
                  </div>
                )}

                {/* Kelengkapan Dokumen - only on first page */}
                {showKelengkapan && kelengkapanDokumen.length > 0 && (
                  <div
                    className={`${isCompactModePage ? "mb-3" : "mb-4"} text-justify`}
                  >
                    <ul
                      className={`space-y-1 ${
                        isCompactModePage ? "text-base" : "text-lg"
                      } ml-4`}
                    >
                      {kelengkapanDokumen.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials Table */}
                {pageMaterials.length > 0 && (
                  <div
                    className={`${isCompactModePage ? "mb-3" : "mb-4"}`}
                    style={{ display: "block", width: "100%" }}
                  >
                    <p
                      className={`${
                        isCompactModePage ? "text-base mb-1" : "text-lg mb-2"
                      }`}
                    >
                      Adapun hasil pemeriksaan sebagai berikut:
                    </p>
                    <table
                      className="border-t border-b border-gray-300 text-sm w-full"
                      style={{
                        display: "table",
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                        tableLayout: "fixed",
                      }}
                    >
                      <thead className="bg-gray-100">
                        <tr
                          className={`${
                            isCompactModePage ? "text-base" : "text-lg"
                          } text-center`}
                        >
                          <th
                            className="border-2 border-gray-800 px-2 py-2"
                            style={{ width: "5%" }}
                          >
                            No.
                          </th>
                          <th
                            className="border-2 border-gray-800 px-2 py-2"
                            style={{ width: "35%" }}
                          >
                            Material Description
                          </th>
                          <th
                            className="border-2 border-gray-800 px-2 py-2"
                            style={{ width: "8%" }}
                          >
                            QTY
                          </th>
                          <th
                            className="border-2 border-gray-800 px-2 py-2"
                            style={{ width: "8%" }}
                          >
                            SAT
                          </th>
                          <th
                            className="border-2 border-gray-800 px-2 py-2"
                            style={{ width: "22%" }}
                          >
                            Serial Number
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={isCompactModePage ? "text-base" : "text-lg"}
                      >
                        {pageMaterials.map((item, index) => {
                          const material = item as any;
                          const globalIndex = startIndex + index;
                          return (
                            <tr key={globalIndex}>
                              <td
                                className={`border-2 border-gray-800 px-2 ${
                                  isCompactModePage ? "py-1" : "py-2"
                                } text-center`}
                              >
                                {globalIndex + 1}
                              </td>
                              <td
                                className={`border-2 border-gray-800 px-2 ${
                                  isCompactModePage ? "py-1" : "py-2"
                                }`}
                                style={{
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                  wordBreak: "break-word",
                                }}
                              >
                                <div className="text-left">
                                  <div className="font-semibold">
                                    {material.nama}
                                  </div>
                                  {material.katalog && (
                                    <div className="">
                                      <span className="font-bold">MERK:</span>{" "}
                                      {material.katalog}
                                    </div>
                                  )}
                                  {material.tipe && (
                                    <div className="">
                                      <span className="font-bold">TYPE:</span>{" "}
                                      {material.tipe}
                                    </div>
                                  )}
                                  {material.lokasi && (
                                    <div className="">
                                      LOKASI: {material.lokasi}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td
                                className={`border-2 border-gray-800 px-2 ${
                                  isCompactModePage ? "py-1" : "py-2"
                                } text-center`}
                                style={{
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {item.jumlah}
                              </td>
                              <td
                                className={`border-2 border-gray-800 px-2 ${
                                  isCompactModePage ? "py-1" : "py-2"
                                } text-center`}
                                style={{
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {item.satuan}
                              </td>
                              <td
                                className={`border-2 border-gray-800 px-2 ${
                                  isCompactModePage ? "py-1" : "py-2"
                                } `}
                                style={{
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                  wordBreak: "break-word",
                                }}
                              >
                                {material.serial_number || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Closing Statement - only on last page */}
                {showClosing && (
                  <div
                    className={`${isCompactModePage ? "mb-3" : "mb-4"} ${
                      isCompactModePage ? "text-base" : "text-lg"
                    }`}
                  >
                    <p>
                      Demikian Berita Acara Pemeriksaan Mutu Barang ini dibuat
                      dengan sesungguhnya untuk dapat dipergunakan sebagai mana
                      mestinya.
                    </p>
                  </div>
                )}

                {/* Signatures - only on last page */}
                {showSignature && (
                  <div
                    className={`flex justify-between ${isCompactModePage ? "mb-2" : "mb-4"}`}
                  >
                    {/* Penyedia Barang */}
                    <div className="text-center">
                      <div
                        className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                          isCompactModePage ? "text-base" : "text-lg"
                        } font-semibold`}
                      >
                        Penyedia Barang
                      </div>
                      <div
                        className={`font-bold ${isCompactModePage ? "mb-2" : "mb-4"} ${
                          isCompactModePage ? "text-base" : "text-lg"
                        }`}
                      >
                        {beritaPemeriksaan.penyedia_barang
                          ?.perusahaan_penyedia_barang ||
                          "(Perusahaan Penyedia Barang)"}
                      </div>

                      {/* Signature Preview */}
                      <div
                        className={`${
                          isCompactModePage ? "h-16 mb-2" : "h-20 mb-4"
                        } flex items-center`}
                      >
                        {beritaPemeriksaan.penyedia_barang?.ttd_penerima ? (
                          <img
                            width={200}
                            height={200}
                            src={getFileUrl(
                              beritaPemeriksaan.penyedia_barang.ttd_penerima,
                              apiUrl,
                            )}
                            alt="TTD Penyedia Barang"
                            className="max-h-full max-w-full object-contain"
                            loading="eager"
                            decoding="sync"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">
                            (Tanda Tangan)
                          </div>
                        )}
                      </div>

                      <div
                        className={`${
                          isCompactModePage ? "text-base" : "text-lg"
                        } font-bold `}
                      >
                        {beritaPemeriksaan.penyedia_barang
                          ?.nama_penanggung_jawab || "(Nama Penanggung Jawab)"}
                      </div>
                    </div>

                    {/* Pemeriksa Barang */}
                    <div className="text-left">
                      <div
                        className={`${isCompactModePage ? "mb-1" : "mb-2"} ${
                          isCompactModePage ? "text-base" : "text-lg"
                        } font-semibold`}
                      >
                        Pemeriksa Barang
                      </div>
                      <div
                        className={`font-bold ${isCompactModePage ? "mb-2" : "mb-4"} ${
                          isCompactModePage ? "text-base" : "text-lg"
                        }`}
                      >
                        {beritaPemeriksaan.pemeriksa_barang
                          ?.departemen_pemeriksa || "(Departemen Pemeriksa)"}
                      </div>

                      {/* List Mengetahui */}
                      {beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
                        beritaPemeriksaan.pemeriksa_barang.mengetahui.length >
                          0 && (
                          <div
                            className={
                              isCompactModePage ? "space-y-2" : "space-y-3"
                            }
                          >
                            {beritaPemeriksaan.pemeriksa_barang.mengetahui.map(
                              (mengetahui, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center ${
                                    isCompactModePage ? "pb-1" : "pb-2"
                                  }`}
                                >
                                  <div
                                    className={`${
                                      isCompactModePage
                                        ? "text-sm"
                                        : "text-base"
                                    } font-semibold min-w-[200px]`}
                                  >
                                    {index + 1}{" "}
                                    {mengetahui.nama_mengetahui ||
                                      "(Nama Mengetahui)"}
                                  </div>
                                  <div
                                    className={`${
                                      isCompactModePage
                                        ? "text-sm"
                                        : "text-base"
                                    } font-semibold`}
                                  >
                                    :
                                  </div>
                                  <div className="flex items-center ml-2">
                                    <div
                                      className={`${
                                        isCompactModePage
                                          ? "w-28 h-10"
                                          : "w-32 h-12"
                                      } flex items-center justify-center border-b-2 border-gray-800`}
                                    >
                                      {mengetahui.ttd_mengetahui ? (
                                        <img
                                          width={120}
                                          height={60}
                                          src={getFileUrl(
                                            mengetahui.ttd_mengetahui,
                                            apiUrl,
                                          )}
                                          alt={`TTD Mengetahui ${index + 1}`}
                                          className="max-h-full max-w-full object-contain"
                                          loading="eager"
                                          decoding="sync"
                                        />
                                      ) : (
                                        <div className="text-gray-400 text-xs">
                                          (Tanda Tangan)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(() => {
            const imageLampiran = getLampiranImages();
            if (imageLampiran.length === 0) return null;

            return (
              <div
                key="lampiran-page-print"
                className="surat-print w-[210mm] h-[297mm] bg-white mx-auto my-0 flex flex-col"
                style={{
                  padding: "10mm 10mm 10mm 10mm",
                  boxSizing: "border-box",
                  pageBreakAfter: "always",
                  pageBreakInside: "avoid",
                }}
              >
                {/* Company Header */}
                <div className="flex items-center gap-4 mb-4">
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
                  </div>
                </div>

                <hr className="border-t-2 border-gray-800 mb-3" />

                {/* Grid Lampiran - 3 kolom */}
                <div
                  className="grid grid-cols-3 gap-4"
                  style={{ maxHeight: "calc(100% - 150px)" }}
                >
                  {imageLampiran.map(
                    (attachment: FileAttachment, index: number) => {
                      const imageUrl = attachment.url.startsWith("http")
                        ? attachment.url
                        : `${apiUrl}${attachment.url}`;

                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center justify-start"
                        >
                          <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={`Lampiran ${index + 1}`}
                              className="w-full h-full object-contain"
                              crossOrigin="anonymous"
                              loading="eager"
                              decoding="sync"
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @page {
          margin: 0;
          size: A4;
        }

        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }

          #print-content-berita-pemeriksaan,
          #print-content-berita-pemeriksaan * {
            visibility: visible;
          }

          #print-content-berita-pemeriksaan {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          .surat-print {
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
          }

          .surat-print:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          /* Ensure images load in print */
          img {
            max-width: 100%;
            height: auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Ensure borders print */
          table,
          th,
          td {
            border-collapse: collapse;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Prevent overflow in print */
          .surat-print {
            overflow: visible !important;
          }

          .surat-print * {
            overflow: visible !important;
          }

          /* Ensure table cells wrap properly */
          table {
            table-layout: fixed;
            width: 100%;
          }

          td,
          th {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
          }
        }
      `}</style>

      {showMobilePrintDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowMobilePrintDialog(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pilih Aksi
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Pilih cara untuk mendapatkan surat Anda
            </p>

            <div className="space-y-3">
              <button
                onClick={handleMobileDownloadPDF}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0056B0] text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Download PDF</span>
              </button>

              <button
                onClick={handleMobilePrintPreview}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 hover:bg-gray-500 rounded-lg transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span className="font-medium">Print Preview</span>
              </button>

              <button
                onClick={() => setShowMobilePrintDialog(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
