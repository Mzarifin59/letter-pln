"use client";

import { Send, StickyNote, Download, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FormData,
  MaterialForm,
  SignatureData,
} from "@/lib/surat-bongkaran/berita-bongkaran.type";
import { useEffect } from "react";

interface PreviewSectionProps {
  formData: FormData;
  materials: MaterialForm[];
  signaturePenerima?: SignatureData;
  signaturePengirim: SignatureData;
  signatureMengetahui?: SignatureData;
  onClose: () => void;
  onSubmit: () => void;
  onDraft: () => void;
  onDownloadPDF: () => void;
  calculateTotal: () => number;
  autoDownload?: boolean;
  lampiran?: File[];
}

const formatDateWithDay = (dateString: string) => {
  if (!dateString) return "Senin, 31 Januari 2025";
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function PreviewSectionBeritaBongkaran({
  formData,
  materials,
  signaturePenerima,
  signaturePengirim,
  signatureMengetahui,
  onClose,
  onSubmit,
  onDraft,
  onDownloadPDF,
  calculateTotal,
  autoDownload = false,
  lampiran = [],
}: PreviewSectionProps) {
  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        onDownloadPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, onDownloadPDF]);

  const getPenerimaSignature = () => {
    return (
      signaturePenerima?.preview.signature ||
      signaturePenerima?.preview.upload ||
      null
    );
  };

  const getPengirimSignature = () => {
    return (
      signaturePengirim.preview.signature ||
      signaturePengirim.preview.upload ||
      null
    );
  };

  const getMengetahuiSignature = () => {
    return (
      signatureMengetahui?.preview.signature ||
      signatureMengetahui?.preview.upload ||
      null
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "31 Januari 2025";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const hasMaterialData = () => {
    return materials.some(
      (m) => m.namaMaterial || m.katalog || m.satuan || m.jumlah || m.keterangan
    );
  };

  const dummyMaterials = [
    {
      no: 1,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "V0 block",
      satuan: "M",
      jumlah: 47,
      keterangan: "MK-051",
    },
    {
      no: 2,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 30,
      keterangan: "MK-052",
    },
    {
      no: 3,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 115,
      keterangan: "MK-PANEL AC/DB",
    },
    {
      no: 1,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "V0 block",
      satuan: "M",
      jumlah: 47,
      keterangan: "MK-051",
    },
    {
      no: 2,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 30,
      keterangan: "MK-052",
    },
    {
      no: 3,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 115,
      keterangan: "MK-PANEL AC/DB",
    },
    {
      no: 1,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "V0 block",
      satuan: "M",
      jumlah: 47,
      keterangan: "MK-051",
    },
    {
      no: 2,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 30,
      keterangan: "MK-052",
    },
    {
      no: 3,
      nama: "KABEL KONTROL 4X4 MM2",
      katalog: "-",
      satuan: "M",
      jumlah: 115,
      keterangan: "MK-PANEL AC/DB",
    },
  ];

  // Get lampiran images
  const getImageLampiran = () => {
    return lampiran && Array.isArray(lampiran)
      ? lampiran.filter((file) => file && file.type && typeof file.type === 'string' && file.type.startsWith("image/"))
      : [];
  };

  // Batas untuk menentukan apakah perlu split ke halaman berikutnya
  // Jika ada lampiran, kurangi threshold untuk memberi ruang lampiran
  const hasLampiran = lampiran && lampiran.length > 0;
  const imageLampiran = getImageLampiran();
  const hasImageLampiran = imageLampiran.length > 0;
  // Jika ada image lampiran, kurangi lebih banyak untuk memberi ruang foto di bawah signature
  const MATERIAL_THRESHOLD = hasImageLampiran ? 5 : hasLampiran ? 6 : 8;
  const MATERIALS_PER_PAGE_WITHOUT_FOOTER = hasImageLampiran ? 14 : hasLampiran ? 16 : 18;

  const activeMaterials = hasMaterialData()
    ? Array.isArray(materials)
      ? materials
      : []
    : dummyMaterials.map((m, idx) => ({
        id: `dummy-${idx}`,
        namaMaterial: m.nama,
        katalog: m.katalog,
        satuan: m.satuan,
        jumlah: m.jumlah,
        keterangan: m.keterangan,
      }));

  // Fungsi untuk membagi materials ke dalam halaman-halaman dengan footer bertahap
  const splitMaterialsIntoPages = () => {
    const totalMaterials = activeMaterials.length;

    // Jika material <= threshold, semua di halaman pertama dengan footer (tanpa lampiran)
    // Lampiran akan di halaman terpisah
    if (totalMaterials <= MATERIAL_THRESHOLD) {
      return [
        {
          materials: activeMaterials,
          showFooter: true,
          footerParts: {
            keterangan: true,
            kendaraan: true,
            tandaTangan: true,
            lampiran: false, // Lampiran di halaman terpisah jika material <= threshold
          },
          isFirstPage: true,
        },
      ];
    }

    // Jika material > threshold, cek bagian footer mana yang masih muat di halaman pertama
    const pages = [];
    let remainingMaterials = [...activeMaterials];

    const imageLampiran = getImageLampiran();
    const hasLampiran = imageLampiran.length > 0;
    
    // Estimasi ruang yang dibutuhkan untuk setiap bagian footer (dalam baris material)
    const SPACE_KETERANGAN = 2;
    const SPACE_KENDARAAN = 3;
    const SPACE_TANDA_TANGAN = 10; // Lebih besar karena ada 3 tanda tangan
    const SPACE_LAMPIRAN = hasLampiran ? 6 : 0;
    
    // Tentukan berapa banyak material yang akan ditampilkan di halaman pertama
    let firstPageMaterialCount = Math.min(totalMaterials, MATERIALS_PER_PAGE_WITHOUT_FOOTER);
    
    // Hitung berapa ruang yang tersisa di halaman pertama setelah material
    // (jika material < MATERIALS_PER_PAGE_WITHOUT_FOOTER, berarti ada ruang tersisa)
    const remainingSpace = MATERIALS_PER_PAGE_WITHOUT_FOOTER - firstPageMaterialCount;
    
    // Cek bagian footer mana yang masih muat dengan ruang yang tersisa
    let footerPartsFirstPage = {
      keterangan: false,
      kendaraan: false,
      tandaTangan: false,
      lampiran: false,
    };

    // Cek secara bertahap, mulai dari yang paling kecil
    let usedSpace = 0;
    
    // Cek Keterangan (butuh 2 baris)
    if (remainingSpace >= usedSpace + SPACE_KETERANGAN) {
      footerPartsFirstPage.keterangan = true;
      usedSpace += SPACE_KETERANGAN;
    }
    
    // Cek Kendaraan (butuh 3 baris)
    if (remainingSpace >= usedSpace + SPACE_KENDARAAN) {
      footerPartsFirstPage.kendaraan = true;
      usedSpace += SPACE_KENDARAAN;
    }
    
    // Cek Tanda Tangan (butuh 10 baris karena ada 3 tanda tangan)
    if (remainingSpace >= usedSpace + SPACE_TANDA_TANGAN) {
      footerPartsFirstPage.tandaTangan = true;
      usedSpace += SPACE_TANDA_TANGAN;
    }
    
    // Cek Lampiran (butuh 6 baris)
    if (hasLampiran && remainingSpace >= usedSpace + SPACE_LAMPIRAN) {
      footerPartsFirstPage.lampiran = true;
      usedSpace += SPACE_LAMPIRAN;
    }

    // Jika ada bagian footer yang muat, kurangi jumlah material di halaman pertama
    // untuk memberi ruang footer (tapi hanya jika material masih banyak)
    if (totalMaterials > MATERIALS_PER_PAGE_WITHOUT_FOOTER && 
        (footerPartsFirstPage.keterangan || footerPartsFirstPage.kendaraan || 
         footerPartsFirstPage.tandaTangan || footerPartsFirstPage.lampiran)) {
      firstPageMaterialCount -= usedSpace;
      // Pastikan minimal masih ada beberapa material
      firstPageMaterialCount = Math.max(firstPageMaterialCount, 5);
    }

    // Halaman pertama: material + bagian footer yang muat
    const firstPageMaterials = remainingMaterials.slice(
      0,
      firstPageMaterialCount
    );
    pages.push({
      materials: firstPageMaterials,
      showFooter: footerPartsFirstPage.keterangan || footerPartsFirstPage.kendaraan || footerPartsFirstPage.tandaTangan || footerPartsFirstPage.lampiran,
      footerParts: footerPartsFirstPage,
      isFirstPage: true,
    });
    remainingMaterials = remainingMaterials.slice(
      firstPageMaterialCount
    );

    // Halaman tengah (jika ada) - tanpa footer
    while (remainingMaterials.length > MATERIALS_PER_PAGE_WITHOUT_FOOTER) {
      const nextPageMaterials = remainingMaterials.slice(
        0,
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
      pages.push({
        materials: nextPageMaterials,
        showFooter: false,
        footerParts: {
          keterangan: false,
          kendaraan: false,
          tandaTangan: false,
          lampiran: false,
        },
        isFirstPage: false,
      });
      remainingMaterials = remainingMaterials.slice(
        MATERIALS_PER_PAGE_WITHOUT_FOOTER
      );
    }

    // Halaman terakhir: sisa material + bagian footer yang belum di-render
    const footerPartsLastPage = {
      keterangan: !footerPartsFirstPage.keterangan,
      kendaraan: !footerPartsFirstPage.kendaraan,
      tandaTangan: !footerPartsFirstPage.tandaTangan,
      lampiran: !footerPartsFirstPage.lampiran && hasLampiran,
    };

    if (remainingMaterials.length > 0) {
      pages.push({
        materials: remainingMaterials,
        showFooter: footerPartsLastPage.keterangan || footerPartsLastPage.kendaraan || footerPartsLastPage.tandaTangan || footerPartsLastPage.lampiran,
        footerParts: footerPartsLastPage,
        isFirstPage: false,
      });
    } else {
      // Jika tidak ada sisa material, footer di halaman kosong
      pages.push({
        materials: [],
        showFooter: footerPartsLastPage.keterangan || footerPartsLastPage.kendaraan || footerPartsLastPage.tandaTangan || footerPartsLastPage.lampiran,
        footerParts: footerPartsLastPage,
        isFirstPage: false,
      });
    }

    return pages;
  };

  const getCopSuratUrl = (): string | null => {
    if (!formData.copSurat) return null;

    if (typeof formData.copSurat === "string") {
      return formData.copSurat;
    }

    if (formData.copSurat instanceof File) {
      return URL.createObjectURL(formData.copSurat);
    }

    return null;
  };

  const copSuratUrl = getCopSuratUrl();
  const materialPages = splitMaterialsIntoPages();

  // Render header component - cop surat di setiap halaman
  const renderHeader = (isFirstPage: boolean) => (
    <>
      <div className="w-full mb-3">
        {copSuratUrl ? (
          <div className="cop-surat-container flex justify-center items-center w-full">
            <img
              src={copSuratUrl}
              alt="Cop Surat"
              className="w-full object-contain"
              onError={(e) => {
                console.error("Error loading cop surat image:", copSuratUrl);
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="font-bold text-2xl text-center">(Cop Surat)</div>
        )}
      </div>
      <hr className="border-t-2 border-gray-800 mb-3" />
    </>
  );

  // Render title and form info (hanya di halaman pertama)
  const renderTitleAndInfo = () => (
    <>
      <div className="text-center mb-3">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-0.5">
          Berita Acara Serah Terima Material Bongkaran
        </h1>
        <div className="text-blue-600 font-semibold text-lg">
          {formData.nomorBeritaAcara || "(No Berita Acara)"}
        </div>
      </div>

      <div className="mb-3">
        <div className="space-y-0.5 text-sm">
          <div className="flex">
            <div className="min-w-[150px]">Pada Hari ini</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formatDateWithDay(formData.tanggalKontrak) ||
                  "Senin, 01 September 2025"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Perihal</div>
            <div className="flex-1">
              :{" "}
              <span className="font-semibold">
                {formData.perihal || "(Perihal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Lokasi Asal</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiAsal || "(Lokasi Asal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[150px]">Lokasi Tujuan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiTujuan || "(Lokasi Tujuan)"}
              </span>
            </div>
          </div>
          <div className="flex">
            <div className="min-w-[150px]">No Kontrak</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.nomorPerjanjianKontrak || "(No Kontrak)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render bagian Keterangan (bagian 1 dari footer)
  const renderFooterKeterangan = () => (
    <>
      <div className="py-1.5 pl-2 border-b-2 border-gray-800">
        <div className="text-sm font-semibold">
          Demikian surat pemberitahuan ini kami sampaikan, atas perhatian dan
          kerjasamanya kami ucapkan terima kasih
        </div>
      </div>
    </>
  );

  // Render bagian Informasi Kendaraan (bagian 2 dari footer)
  const renderFooterKendaraan = () => (
    <div className="pl-2 grid grid-cols-2 gap-8 mb-4 text-sm py-1.5">
      <div className="table">
        <div className="table-row">
          <div className="table-cell pr-4 font-semibold">Kendaraan</div>
          <div className="table-cell">
            : {formData.informasiKendaraan || "(Kendaraan)"}
          </div>
        </div>
        <div className="table-row">
          <div className="table-cell pr-4 font-semibold">Pengemudi</div>
          <div className="table-cell">
            : {formData.namaPengemudi || "(Pengemudi)"}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div>
          Bandung, {formatDate(formData.tanggalKontrak) || "1 Nov 2025"}
        </div>
      </div>
    </div>
  );

  // Render bagian Tanda Tangan (bagian 3 dari footer)
  const renderFooterTandaTangan = () => (
    <>
      <div className="grid grid-cols-2 gap-8 text-center mb-4">
        <div className="relative">
          <div className="mb-1 text-sm">Yang Menerima,</div>
          <div className="font-bold mb-2 text-sm">
            {formData.perusahaanPenerima || "(Perusahaan Penerima)"}
          </div>
          <Image
            src={`/images/ttd.png`}
            alt="TTD"
            width={100}
            height={100}
            className="absolute z-0 left-24 bottom-3"
          />
          <div className="h-16 mb-2 flex items-center justify-center">
            {getPenerimaSignature() ? (
              <img
                src={getPenerimaSignature()!}
                alt="Signature Penerima"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
            )}
          </div>

          <div className="text-sm font-bold">
            {formData.namaPenerima || "(Nama Penerima)"}
          </div>
        </div>

        <div className="relative">
          <div className="mb-1 text-sm">Yang Menyerahkan,</div>
          <div className="font-bold mb-2 text-sm">
            {formData.departemenPengirim || "(Departemen Pengirim)"}
          </div>
          <div className="h-16 mb-2 flex items-center justify-center">
            {getPengirimSignature() ? (
              <img
                src={getPengirimSignature()!}
                alt="Signature Pengirim"
                className="max-h-full max-w-full object-contain z-20"
              />
            ) : (
              <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
            )}
          </div>

          <div className="font-bold text-sm">
            {formData.namaPengirim || "(Nama Pengirim)"}
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="mb-1 text-sm">Yang Mengetahui,</div>
        <div className="font-bold mb-2 text-sm">
          {formData.departemenMengetahui || "(Departemen Mengetahui)"}
        </div>

        <div className="h-16 mb-2 flex items-center justify-center">
          {getMengetahuiSignature() ? (
            <img
              src={getMengetahuiSignature()!}
              alt="Signature Mengetahui"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-xs">(Tanda Tangan)</div>
          )}
        </div>

        <div className="text-sm font-bold">
          {formData.namaMengetahui || "(Nama Mengetahui)"}
        </div>
      </div>
    </>
  );

  // Render bagian Lampiran (bagian 4 dari footer) - hanya menampilkan beberapa lampiran
  // Tanpa judul dan tanpa nama file (hanya gambar)
  const renderFooterLampiran = (lampiranToShow: File[] = []) => {
    const imageLampiran = lampiranToShow.length > 0 ? lampiranToShow : getImageLampiran();
    
    if (imageLampiran.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="grid grid-cols-3 gap-4">
          {imageLampiran.map((file, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-start"
            >
              <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Lampiran ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render footer lengkap (untuk backward compatibility)
  const renderFooter = () => {
    return (
      <>
        {renderFooterKeterangan()}
        {renderFooterKendaraan()}
        {renderFooterTandaTangan()}
        {renderFooterLampiran()}
      </>
    );
  };

  // Fungsi untuk membagi lampiran ke beberapa halaman
  // Satu halaman bisa menampilkan sekitar 15-18 gambar (3 kolom x 5-6 baris)
  const splitLampiranIntoPages = () => {
    const imageLampiran = getImageLampiran();
    if (imageLampiran.length === 0) return [];

    const LAMPIRAN_PER_PAGE = 15; // 3 kolom x 5 baris
    const pages = [];
    
    for (let i = 0; i < imageLampiran.length; i += LAMPIRAN_PER_PAGE) {
      pages.push(imageLampiran.slice(i, i + LAMPIRAN_PER_PAGE));
    }
    
    return pages;
  };

  // Render halaman lampiran terpisah
  const renderLampiranPages = () => {
    const imageLampiran = getImageLampiran();
    if (imageLampiran.length === 0) return null;

    // Tentukan lampiran mana yang sudah ditampilkan di footer
    let lampiranAlreadyShown = 0;
    
    if (activeMaterials.length <= MATERIAL_THRESHOLD) {
      // Jika material <= threshold, lampiran tidak ditampilkan di footer
      // Semua lampiran di halaman terpisah
      lampiranAlreadyShown = 0;
    } else {
      // Cek halaman terakhir apakah ada lampiran di footer
      const lastPage = materialPages[materialPages.length - 1];
      if (lastPage?.footerParts?.lampiran) {
        // Jika ada lampiran di footer, hanya 6 lampiran pertama yang ditampilkan
        lampiranAlreadyShown = 6;
      } else {
        // Jika tidak ada lampiran di footer, semua lampiran di halaman terpisah
        lampiranAlreadyShown = 0;
      }
    }

    // Ambil sisa lampiran yang belum ditampilkan
    const lampiranToRender = imageLampiran.slice(lampiranAlreadyShown);
    
    if (lampiranToRender.length === 0) return null;

    // Bagi lampiran ke beberapa halaman jika banyak (15 per halaman: 3 kolom x 5 baris)
    const lampiranPages = [];
    const LAMPIRAN_PER_PAGE = 15;
    
    for (let i = 0; i < lampiranToRender.length; i += LAMPIRAN_PER_PAGE) {
      lampiranPages.push(lampiranToRender.slice(i, i + LAMPIRAN_PER_PAGE));
    }

    return lampiranPages.map((pageLampiran, pageIndex) => {
      const startIndex = lampiranAlreadyShown + pageIndex * LAMPIRAN_PER_PAGE;
      
      return (
        <div
          key={`lampiran-${pageIndex}`}
          className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
          data-page={`lampiran-${pageIndex}`}
          style={{
            padding: "15mm 15mm 15mm 15mm",
            boxSizing: "border-box",
          }}
        >
          {/* Header dengan cop surat */}
          {renderHeader(false)}
          
          {/* Title Lampiran */}
          <div className="text-center mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              LAMPIRAN
            </h2>
            {lampiranPages.length > 1 && (
              <p className="text-sm text-gray-600">
                Halaman {pageIndex + 1} dari {lampiranPages.length}
              </p>
            )}
          </div>

          {/* Grid Lampiran - 3 kolom */}
          <div className="grid grid-cols-3 gap-4" style={{ maxHeight: 'calc(100% - 200px)' }}>
            {pageLampiran.map((file, index) => {
              const globalIndex = startIndex + index;
              return (
                <div 
                  key={globalIndex} 
                  className="flex flex-col items-center justify-start"
                >
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Lampiran ${globalIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Preview Surat</h2>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
              size="sm"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Kirim</span>
            </Button>
            <Button variant="outline" onClick={onDraft} size="sm" className="text-xs sm:text-sm">
              <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Draft</span>
            </Button>
            <Button variant="outline" onClick={onDownloadPDF} size="sm" className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button variant="outline" onClick={onClose} size="sm">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="bg-[#F6F9FF] p-8 overflow-y-auto flex-1">
          <div id="preview-content" className="w-full flex justify-center">
            <div className="w-80 sm:w-[210mm] scale-[0.38] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 transform origin-top-left">
              {/* Loop untuk setiap halaman material */}
              {materialPages.map((pageData, pageIndex) => {
              const {
                materials: pageMaterials,
                showFooter,
                footerParts = {
                  keterangan: false,
                  kendaraan: false,
                  tandaTangan: false,
                  lampiran: false,
                },
                isFirstPage,
              } = pageData;

              // Hitung nomor awal untuk halaman ini
              let startIndex = 0;
              for (let i = 0; i < pageIndex; i++) {
                startIndex += materialPages[i].materials.length;
              }

              return (
                <div
                  key={pageIndex}
                  className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                  data-page={pageIndex}
                  style={{
                    padding: "15mm 15mm 15mm 15mm",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header - ada di setiap halaman */}
                  {renderHeader(isFirstPage)}

                  {/* Title dan Info - hanya di halaman pertama */}
                  {isFirstPage && renderTitleAndInfo()}

                  {/* Materials Table - jika ada material di halaman ini */}
                  {pageMaterials.length > 0 && (
                    <div className="mb-2">
                      <table
                        className="w-full border-collapse"
                        style={{ fontSize: "12px" }}
                      >
                        <thead className="bg-gray-100">
                          <tr className="text-center">
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "5%" }}
                            >
                              NO
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "30%" }}
                            >
                              NAMA MATERIAL
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "12%" }}
                            >
                              KATALOG
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "10%" }}
                            >
                              SATUAN
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "10%" }}
                            >
                              JUMLAH
                            </th>
                            <th
                              className="border-2 border-gray-800 px-1.5 py-1"
                              style={{ width: "33%" }}
                            >
                              KETERANGAN (LOKASI TYPE, S/N DLL)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageMaterials.map((material, idx) => (
                            <tr key={material.id || idx}>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {startIndex + idx + 1}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1">
                                {material.namaMaterial || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.katalog || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.satuan || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.jumlah || "0"}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {material.keterangan || "-"}
                              </td>
                            </tr>
                          ))}

                          {/* Total row jika showFooter */}
                          {showFooter && (
                            <tr className="bg-gray-100 font-semibold">
                              <td
                                colSpan={4}
                                className="border-2 border-gray-800 px-1.5 py-1 text-center"
                              >
                                TOTAL
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                                {hasMaterialData()
                                  ? calculateTotal()
                                  : dummyMaterials.reduce(
                                      (sum, m) => sum + m.jumlah,
                                      0
                                    )}
                              </td>
                              <td className="border-2 border-gray-800 px-1.5 py-1"></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer - render bagian yang sesuai */}
                  {showFooter && (
                    <>
                      {footerParts.keterangan && renderFooterKeterangan()}
                      {footerParts.kendaraan && renderFooterKendaraan()}
                      {footerParts.tandaTangan && renderFooterTandaTangan()}
                      {footerParts.lampiran && (
                        (() => {
                          // Jika ini halaman terakhir dengan footer, tampilkan lampiran terbatas
                          // Jika lampiran banyak, sisa akan di halaman terpisah
                          const imageLampiran = getImageLampiran();
                          const LAMPIRAN_PER_PAGE = 6; // Maksimal 6 lampiran di footer (2x3 grid)
                          const lampiranToShow = imageLampiran.slice(0, LAMPIRAN_PER_PAGE);
                          return renderFooterLampiran(lampiranToShow);
                        })()
                      )}
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Halaman Lampiran terpisah - untuk lampiran yang tidak muat atau jika material <= threshold */}
            {renderLampiranPages()}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden div untuk PDF generation - tidak terpengaruh responsive scale */}
      <div
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          backgroundColor: "#ffffff",
          zIndex: -1,
        }}
      >
        <div id="hidden-preview-content">
          {/* Loop untuk setiap halaman material */}
          {materialPages.map((pageData, pageIndex) => {
            const {
              materials: pageMaterials,
              showFooter,
              footerParts = {
                keterangan: false,
                kendaraan: false,
                tandaTangan: false,
                lampiran: false,
              },
              isFirstPage,
            } = pageData;

            // Hitung nomor awal untuk halaman ini
            let startIndex = 0;
            for (let i = 0; i < pageIndex; i++) {
              startIndex += materialPages[i].materials.length;
            }

            return (
              <div
                key={pageIndex}
                className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                data-page={pageIndex}
                style={{
                  padding: "15mm 15mm 15mm 15mm",
                  boxSizing: "border-box",
                  whiteSpace: "normal",
                  wordSpacing: "normal",
                }}
              >
                {/* Header - ada di setiap halaman */}
                {renderHeader(isFirstPage)}

                {/* Title dan Info - hanya di halaman pertama */}
                {isFirstPage && renderTitleAndInfo()}

                {/* Materials Table - jika ada material di halaman ini */}
                {pageMaterials.length > 0 && (
                  <div className="mb-2">
                    <table
                      className="w-full border-collapse"
                      style={{ fontSize: "12px" }}
                    >
                      <thead className="bg-gray-100">
                        <tr className="text-center">
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "5%" }}
                          >
                            NO
                          </th>
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "30%" }}
                          >
                            NAMA MATERIAL
                          </th>
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "12%" }}
                          >
                            KATALOG
                          </th>
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "10%" }}
                          >
                            SATUAN
                          </th>
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "10%" }}
                          >
                            JUMLAH
                          </th>
                          <th
                            className="border-2 border-gray-800 px-1.5 py-1"
                            style={{ width: "33%" }}
                          >
                            KETERANGAN (LOKASI TYPE, S/N DLL)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageMaterials.map((material, idx) => (
                          <tr key={material.id || idx}>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {startIndex + idx + 1}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1">
                              {material.namaMaterial || "-"}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {material.katalog || "-"}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {material.satuan || "-"}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {material.jumlah || "0"}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {material.keterangan || "-"}
                            </td>
                          </tr>
                        ))}

                        {/* Total row jika showFooter */}
                        {showFooter && (
                          <tr className="bg-gray-100 font-semibold">
                            <td
                              colSpan={4}
                              className="border-2 border-gray-800 px-1.5 py-1 text-center"
                            >
                              TOTAL
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1 text-center">
                              {hasMaterialData()
                                ? calculateTotal()
                                : dummyMaterials.reduce(
                                    (sum, m) => sum + m.jumlah,
                                    0
                                  )}
                            </td>
                            <td className="border-2 border-gray-800 px-1.5 py-1"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer - render bagian yang sesuai */}
                {showFooter && (
                  <>
                    {footerParts.keterangan && renderFooterKeterangan()}
                    {footerParts.kendaraan && renderFooterKendaraan()}
                    {footerParts.tandaTangan && renderFooterTandaTangan()}
                    {footerParts.lampiran && (
                      (() => {
                        const imageLampiran = getImageLampiran();
                        const LAMPIRAN_PER_PAGE = 6;
                        const lampiranToShow = imageLampiran.slice(0, LAMPIRAN_PER_PAGE);
                        return renderFooterLampiran(lampiranToShow);
                      })()
                    )}
                  </>
                )}
              </div>
            );
          })}
          
          {/* Halaman Lampiran terpisah */}
          {renderLampiranPages()}
        </div>
      </div>
    </div>
  );
}