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
  ];

  const MATERIALS_PER_PAGE = 15;
  const activeMaterials = hasMaterialData() ? materials : dummyMaterials.map((m, idx) => ({
    id: `dummy-${idx}`,
    namaMaterial: m.nama,
    katalog: m.katalog,
    satuan: m.satuan,
    jumlah: m.jumlah,
    keterangan: m.keterangan,
  }));

  const splitMaterialsIntoPages = () => {
    const pages = [];
    for (let i = 0; i < activeMaterials.length; i += MATERIALS_PER_PAGE) {
      pages.push(activeMaterials.slice(i, i + MATERIALS_PER_PAGE));
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
          <div className="text-sm font-semibold text-[#232323] leading-tight">
            PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
          </div>
          <div className="text-sm font-semibold text-[#232323] leading-tight">
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

  // Render title and form info
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

        <div className="space-y-0.5 text-base">
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
                {formData.perihal ||
                  "(Perihal)"}
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

  // Render footer with signatures
  const renderFooter = () => (
    <>
      <div className="pb-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold">Keterangan :</div>
      </div>
      <div className="py-2 pl-2 border-b-2 border-gray-800">
        <div className="text-base font-semibold">
          {formData.catatanTambahan ||
            "(Catatan)"}
        </div>
      </div>

      <div className="pl-2 grid grid-cols-2 gap-8 mb-6 text-base py-2">
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
          <div>Bandung, {formatDate(formData.tanggalSurat) || "1 Nov 2025"}</div>
        </div>
      </div>

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
    </>
  );

  const lembarLabels = [
    "Pengirim Barang",
    "Penerima Barang",
    "Satpam",
    formData.lokasiTujuan,
  ];

  return (
    <div className="bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Preview Surat</h2>
          <div className="flex gap-3">
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
            <Button variant="outline" onClick={onDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="bg-[#F6F9FF] p-8 overflow-y-auto flex-1">
          <div id="preview-content">
            {[0, 1, 2, 3].map((lembarIndex) => (
              <div key={lembarIndex}>
                {materialPages.map((pageMaterials, pageIndex) => {
                  const isFirstPage = pageIndex === 0;
                  const isLastPage = pageIndex === materialPages.length - 1;
                  const startIndex = pageIndex * MATERIALS_PER_PAGE;

                  return (
                    <div
                      key={`${lembarIndex}-${pageIndex}`}
                      className="surat w-[210mm] min-h-[297mm] max-h-[297mm] bg-white shadow-lg mx-auto my-8 flex flex-col"
                      data-lembar={lembarIndex}
                      data-page={pageIndex}
                      style={{
                        padding: "15mm 15mm 15mm 15mm",
                        boxSizing: "border-box",
                      }}
                    >
                      {renderHeader(lembarIndex, lembarLabels)}

                      {isFirstPage && renderTitleAndInfo()}

                      {/* Materials Table */}
                      <div className="mb-4">
                        <table className="w-full border-collapse" style={{ fontSize: "13px" }}>
                          <thead className="bg-gray-100">
                            <tr className="text-center">
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "5%" }}>NO</th>
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "30%" }}>NAMA MATERIAL</th>
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "12%" }}>KATALOG</th>
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "10%" }}>SATUAN</th>
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "10%" }}>JUMLAH</th>
                              <th className="border-2 border-gray-800 px-1.5 py-1.5" style={{ width: "33%" }}>KETERANGAN (LOKASI TYPE, S/N DLL)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pageMaterials.map((material, idx) => (
                              <tr key={material.id || idx}>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {startIndex + idx + 1}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5">
                                  {material.namaMaterial || "-"}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {material.katalog || "-"}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {material.satuan || "-"}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {material.jumlah || "0"}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5 text-center">
                                  {material.keterangan || "-"}
                                </td>
                              </tr>
                            ))}

                            {/* Total row hanya di halaman terakhir */}
                            {isLastPage && (
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
                                    : dummyMaterials.reduce((sum, m) => sum + m.jumlah, 0)}
                                </td>
                                <td className="border-2 border-gray-800 px-1.5 py-1.5"></td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer hanya di halaman terakhir */}
                      {isLastPage && renderFooter()}

                      {/* Indikator halaman jika multi-page */}
                      {/* {!isLastPage && (
                        <div className="text-center text-gray-500 text-xs mt-auto pt-3">
                          Halaman {pageIndex + 1} dari {materialPages.length} - Lanjutan di halaman berikutnya
                        </div>
                      )} */}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
