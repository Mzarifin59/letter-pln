"use client";

import { Send, StickyNote, Download, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FormData,
  MaterialForm,
  SignatureData,
} from "@/lib/surat-jalan/surat-jalan.type";
import { useEffect } from "react";
import { toast } from "sonner";

interface PreviewSectionProps {
  formData: FormData;
  materials: MaterialForm[];
  signaturePenerima: SignatureData;
  signaturePengirim: SignatureData;
  onClose: () => void;
  onSubmit: () => void;
  onDraft: () => void;
  onDownloadPDF: () => void;
  calculateTotal: () => number;
  autoDownload?: boolean;
  lampiran?: File[];
}

export default function PreviewSection({
  formData,
  materials,
  signaturePenerima,
  signaturePengirim,
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
        handleDownloadClick();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, onDownloadPDF]);

  const handleDownloadClick = () => {
    const toastId = toast.loading("Generating PDF...", {
      position: "top-center",
    });
    
    onDownloadPDF();
    
    // Hide loading after 5 seconds (sufficient time for PDF generation)
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success("PDF generated successfully!", {
        position: "top-center",
      });
    }, 5000);
  };

  const getPenerimaSignature = () => {
    return (
      signaturePenerima.preview.signature ||
      signaturePenerima.preview.upload ||
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
  ];

  // Get lampiran images - harus didefinisikan sebelum digunakan
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

    // Jika material <= 8, semua di halaman pertama dengan footer (tanpa lampiran)
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
            lampiran: false, // Lampiran di halaman terpisah jika material <= 8
          },
          isFirstPage: true,
        },
      ];
    }

    // Jika material > 8, cek bagian footer mana yang masih muat di halaman pertama
    const pages = [];
    let remainingMaterials = [...activeMaterials];

    const imageLampiran = getImageLampiran();
    const hasLampiran = imageLampiran.length > 0;
    
    // Estimasi ruang yang dibutuhkan untuk setiap bagian footer (dalam baris material)
    const SPACE_KETERANGAN = 2;
    const SPACE_KENDARAAN = 3;
    const SPACE_TANDA_TANGAN = 8;
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
    
    // Cek Tanda Tangan (butuh 8 baris)
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

  const materialPages = splitMaterialsIntoPages();

  // Render header component
  const renderHeader = (lembarIndex: number, lembarLabels: string[]) => (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          <Image
            src="/images/PLN-logo.png"
            alt="PLN Logo"
            width={90}
            height={90}
            className="w-[90px] h-[90px] object-contain"
          />
        </div>
        <div className="flex-1">
          <div 
            className="text-sm font-semibold text-[#232323] leading-tight"
            style={{ whiteSpace: "normal", wordSpacing: "normal" }}
          >
            PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
          </div>
          <div 
            className="text-sm font-semibold text-[#232323] leading-tight"
            style={{ whiteSpace: "normal", wordSpacing: "normal" }}
          >
            UNIT PELAKSANA TRANSMISI BANDUNG
          </div>
        </div>
        <div className="flex-shrink-0 bg-[rgba(166,35,68,0.1)] px-4 py-1.5 rounded-lg border border-[rgb(166,35,68)]">
          <div className="text-lg font-bold text-[rgb(166,35,68)] leading-tight">
            LEMBAR {lembarIndex + 1}
          </div>
          <div className="text-base text-[rgb(166,35,68)] leading-tight">
            {lembarLabels[lembarIndex]}
          </div>
        </div>
      </div>
      <hr className="border-t-2 border-gray-800 mb-3" />
    </>
  );

  // Render title and form info (hanya di halaman pertama)
  const renderTitleAndInfo = () => (
    <>
      <div className="text-center mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          SURAT JALAN
        </h1>
        <div className="text-blue-600 font-semibold text-xl">
          {formData.nomorSuratJalan || "(No Surat Jalan)"}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 text-base">
          Mohon diizinkan membawa barang-barang tersebut di bawah ini :
        </div>

        <div className="space-y-0.5 text-base" style={{ whiteSpace: "normal", wordSpacing: "normal" }}>
          <div className="flex">
            <div className="min-w-[170px]">No Surat Permintaan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.nomorSuratPermintaan || "(No Surat Permintaan)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Untuk Keperluan</div>
            <div className="flex-1">
              :{" "}
              <span className="font-semibold">
                {formData.perihal || "(Perihal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Lokasi Asal</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiAsal || "(Lokasi Asal)"}
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="min-w-[170px]">Lokasi Tujuan</div>
            <div>
              :{" "}
              <span className="font-semibold">
                {formData.lokasiTujuan || "(Lokasi Tujuan)"}
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
      <div className="pb-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold" style={{ whiteSpace: "normal", wordSpacing: "normal" }}>Keterangan :</div>
      </div>
      <div className="py-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold" style={{ whiteSpace: "normal", wordSpacing: "normal" }}>
          {formData.catatanTambahan || "(Catatan)"}
        </div>
      </div>
    </>
  );

  // Render bagian Informasi Kendaraan (bagian 2 dari footer)
  const renderFooterKendaraan = () => (
    <div className="pl-2 grid grid-cols-2 gap-8 mb-6 text-base py-2" style={{ whiteSpace: "normal", wordSpacing: "normal" }}>
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
          Bandung, {formatDate(formData.tanggalSurat) || "1 Nov 2025"}
        </div>
      </div>
    </div>
  );

  // Render bagian Tanda Tangan (bagian 3 dari footer)
  const renderFooterTandaTangan = () => (
    <div className="grid grid-cols-2 gap-12 text-center">
      <div>
        <div className="mb-1.5 text-base">Yang Menerima,</div>
        <div className="font-bold mb-3 text-base">
          {formData.perusahaanPenerima || "(Perusahaan Penerima)"}
        </div>

        <div className="h-20 mb-3 flex items-center justify-center">
          {getPenerimaSignature() ? (
            <img
              src={getPenerimaSignature()!}
              alt="Signature Penerima"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-sm">(Tanda Tangan)</div>
          )}
        </div>

        <div className="text-base font-bold">
          {formData.namaPenerima || "(Nama Penerima)"}
        </div>
      </div>

      <div className="relative">
        <div className="mb-1.5 text-base">Yang Menyerahkan,</div>
        <div className="font-bold mb-3 text-base">
          {formData.departemenPengirim || "(Departemen Pengirim)"}
        </div>
        <Image
          src={`/images/ttd.png`}
          alt="TTD"
          width={120}
          height={120}
          className="absolute z-0 left-16 bottom-4"
        />
        <div className="h-20 mb-3 flex items-center justify-center">
          {getPengirimSignature() ? (
            <img
              src={getPengirimSignature()!}
              alt="Signature Pengirim"
              className="max-h-full max-w-full object-contain z-20"
            />
          ) : (
            <div className="text-gray-400 text-sm">(Tanda Tangan)</div>
          )}
        </div>

        <div className="font-bold text-base">
          {formData.namaPengirim || "(Nama Pengirim)"}
        </div>
      </div>
    </div>
  );

  // Render bagian Lampiran (bagian 4 dari footer)
  const renderFooterLampiran = () => {
    const imageLampiran = getImageLampiran();
    
    if (imageLampiran.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="text-base font-semibold mb-3 text-center">
          LAMPIRAN
        </div>
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

  // Render halaman lampiran terpisah (jika material <= 8)
  const renderLampiranPage = (lembarIndex: number, lembarLabels: string[]) => {
    // Hanya render halaman lampiran terpisah jika material <= 8
    if (activeMaterials.length > MATERIAL_THRESHOLD) {
      return null;
    }

    const imageLampiran = getImageLampiran();
    if (imageLampiran.length === 0) return null;

    return (
      <div
        key={`${lembarIndex}-lampiran`}
        className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
        data-lembar={lembarIndex}
        data-page="lampiran"
        style={{
          padding: "15mm 15mm 15mm 15mm",
          boxSizing: "border-box",
          whiteSpace: "normal",
          wordSpacing: "normal",
        }}
      >
        {/* Header */}
        {renderHeader(lembarIndex, lembarLabels)}
        
        {/* Title Lampiran */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            LAMPIRAN
          </h2>
        </div>

        {/* Grid Lampiran - 3 kolom untuk banyak foto */}
        <div className="grid grid-cols-3 gap-4" style={{ maxHeight: 'calc(100% - 150px)' }}>
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

  const lembarLabels = [
    "Pengirim Barang",
    "Penerima Barang",
    "Satpam",
    formData.lokasiTujuan || "Tujuan",
  ];

  return (
    <div className="bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-[90vh] overflow-hidden flex flex-col">
        <div className="flex max-sm:flex-col gap-5 items-center sm:justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Preview Surat</h2>
          <div className="flex max-sm:flex-wrap max-sm:justify-center items-center gap-3">
            <Button
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Kirim
            </Button>
            <Button variant="outline" onClick={onDraft}>
              <StickyNote className="w-4 h-4 mr-2" />
              Draft
            </Button>
            <Button variant="outline" onClick={handleDownloadClick}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="bg-[#F6F9FF] p-8 overflow-y-auto flex-1">
          <div id="preview-content" className="w-full flex justify-center">
            <div className="w-80 sm:w-[210mm] scale-[0.38] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 transform origin-top-left">
              {/* Loop untuk setiap lembar (4 lembar) */}
              {[0, 1, 2, 3].map((lembarIndex) => (
                <div key={lembarIndex}>
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

                    const isLastPage = pageIndex === materialPages.length - 1;

                    return (
                      <div
                        key={`${lembarIndex}-${pageIndex}`}
                        className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                        data-lembar={lembarIndex}
                        data-page={pageIndex}
                        style={{
                          padding: "15mm 15mm 15mm 15mm",
                          boxSizing: "border-box",
                          whiteSpace: "normal",
                          wordSpacing: "normal",
                        }}
                      >
                        {/* Header - ada di setiap halaman */}
                        {renderHeader(lembarIndex, lembarLabels)}

                        {/* Title dan Info - hanya di halaman pertama */}
                        {isFirstPage && renderTitleAndInfo()}

                        {/* Materials Table - jika ada material di halaman ini */}
                        {pageMaterials.length > 0 && (
                          <div className="mb-3">
                            <table
                              className="w-full border-collapse"
                              style={{ fontSize: "13px" }}
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
                                      className="border-2 border-gray-800 px-1.5 py-1.5 text-center"
                                    >
                                      TOTAL
                                    </td>
                                    <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                      {hasMaterialData()
                                        ? calculateTotal()
                                        : dummyMaterials.reduce(
                                            (sum, m) => sum + m.jumlah,
                                            0
                                          )}
                                    </td>
                                    <td className="border-2 border-gray-800 px-1.5 py-1.5"></td>
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
                            {footerParts.lampiran && renderFooterLampiran()}
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Halaman Lampiran terpisah - hanya jika material <= 8 */}
                  {renderLampiranPage(lembarIndex, lembarLabels)}
                </div>
              ))}
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
          {/* Loop untuk setiap lembar (4 lembar) */}
          {[0, 1, 2, 3].map((lembarIndex) => (
            <div key={lembarIndex}>
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
                    key={`${lembarIndex}-${pageIndex}`}
                    className="surat w-[210mm] h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col overflow-hidden"
                    data-lembar={lembarIndex}
                    data-page={pageIndex}
                    style={{
                      padding: "15mm 15mm 15mm 15mm",
                      boxSizing: "border-box",
                      whiteSpace: "normal",
                      wordSpacing: "normal",
                    }}
                  >
                    {/* Header - ada di setiap halaman */}
                    {renderHeader(lembarIndex, lembarLabels)}

                    {/* Title dan Info - hanya di halaman pertama */}
                    {isFirstPage && renderTitleAndInfo()}

                    {/* Materials Table - jika ada material di halaman ini */}
                    {pageMaterials.length > 0 && (
                      <div className="mb-3">
                        <table
                          className="w-full border-collapse"
                          style={{ fontSize: "13px" }}
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
                                  className="border-2 border-gray-800 px-1.5 py-1.5 text-center"
                                >
                                  TOTAL
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {hasMaterialData()
                                    ? calculateTotal()
                                    : dummyMaterials.reduce(
                                        (sum, m) => sum + m.jumlah,
                                        0
                                      )}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5"></td>
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
                        {footerParts.lampiran && renderFooterLampiran()}
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* Halaman Lampiran terpisah - hanya jika material <= 8 */}
              {renderLampiranPage(lembarIndex, lembarLabels)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
