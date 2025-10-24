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
      // Tunggu render selesai dengan timeout lebih panjang untuk ensure DOM ready
      const timer = setTimeout(() => {
        onDownloadPDF();
      }, 1000); // 1 detik untuk memastikan semua gambar/signature ter-load

      return () => clearTimeout(timer);
    }
  }, [autoDownload, onDownloadPDF]);

  // Get signature preview (prioritas: drawn signature > uploaded file)
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

  // Format date to Indonesian format
  const formatDate = (dateString: string) => {
    if (!dateString) return "31 Januari 2025";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Check if materials have data
  const hasMaterialData = () => {
    return materials.some(
      (m) => m.namaMaterial || m.katalog || m.satuan || m.jumlah || m.keterangan
    );
  };

  // Default dummy materials for preview
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

  return (
    <div className="bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Preview Header */}
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

        {/* Preview Content - Scrollable */}
        <div className="bg-[#F6F9FF] p-8 overflow-y-auto flex-1">
          <div id="preview-content">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="surat w-[210mm] bg-white shadow-lg px-8 py-4 max-w-[1200px] mx-auto my-8">
                {/* Company Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src="/images/PLN-logo.png"
                      alt="PLN Logo"
                      width={104}
                      height={104}
                      className="w-[104px] h-[104px] object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-[#232323]">
                      PT PLN (PERSERO) UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH
                    </div>
                    <div className="text-base font-semibold text-[#232323]">
                      UNIT PELAKSANA TRANSMISI BANDUNG
                    </div>
                    <div className="text-base text-[#232323]">
                      Jl. Soekarno-Hatta No. 606 Bandung 40286
                    </div>
                  </div>
                  <div className="flex-shrink-0 bg-[rgba(166,35,68,0.1)] px-6 py-2 rounded-lg border border-[rgb(166,35,68)]">
                    <div className="text-[22px] font-bold text-[rgb(166,35,68)]">
                      LEMBAR {index + 1}
                    </div>
                    <div className="text-xl text-[rgb(166,35,68)]">
                      Pengirim Barang
                    </div>
                  </div>
                </div>
                
                <hr className="border-t-4 border-gray-800 mb-4" />

                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                    SURAT JALAN
                  </h1>
                  <div className="text-blue-600 font-semibold text-2xl">
                    {formData.nomorSuratJalan ||
                      "NO : 001.SJ/GD.UPT-BDG/IX/2025"}
                  </div>
                </div>

                {/* Form Information */}
                <div className="mb-6">
                  <div className="mb-2 text-lg">
                    Mohon diizinkan membawa barang-barang tersebut di bawah ini
                    :
                  </div>
                  <div className="space-y-1 text-lg">
                    <div>
                      No Surat Permintaan :{" "}
                      <span className="font-semibold">
                        {formData.nomorSuratPermintaan ||
                          "001.REQ/GD.UPT-BDG/IX/2025"}
                      </span>
                    </div>
                    <div>
                      Untuk Keperluan :{" "}
                      <span className="font-semibold">
                        {formData.perihal ||
                          "PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"}
                      </span>
                    </div>
                    <div>
                      Lokasi Asal :{" "}
                      <span className="font-semibold">
                        {formData.lokasiAsal || "GUDANG GARENTING"}
                      </span>
                    </div>
                    <div>
                      Lokasi Tujuan :{" "}
                      <span className="font-semibold">
                        {formData.lokasiTujuan || "GI BANDUNG UTARA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Materials Table */}
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100">
                      <tr className="text-lg text-center">
                        <th className="border-2 border-gray-800 px-2 py-2">
                          NO
                        </th>
                        <th className="border-2 border-gray-800 px-2 py-2">
                          NAMA MATERIAL
                        </th>
                        <th className="border-2 border-gray-800 px-2 py-2">
                          KATALOG
                        </th>
                        <th className="border-2 border-gray-800 px-2 py-2">
                          SATUAN
                        </th>
                        <th className="border-2 border-gray-800 px-2 py-2">
                          JUMLAH
                        </th>
                        <th className="border-2 border-gray-800 px-2 py-2">
                          KETERANGAN (LOKASI TYPE, S/N DLL)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-lg">
                      {hasMaterialData()
                        ? materials.map((material, index) => (
                            <tr key={material.id}>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {index + 1}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2">
                                {material.namaMaterial || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.katalog || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.satuan || "-"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.jumlah || "0"}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.keterangan || "-"}
                              </td>
                            </tr>
                          ))
                        : dummyMaterials.map((material) => (
                            <tr key={material.no}>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.no}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2">
                                {material.nama}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.katalog}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.satuan}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.jumlah}
                              </td>
                              <td className="border-2 border-gray-800 px-2 py-2 text-center">
                                {material.keterangan}
                              </td>
                            </tr>
                          ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td
                          colSpan={4}
                          className="border-2 border-gray-800 px-2 py-2 text-center"
                        >
                          TOTAL
                        </td>
                        <td className="border-2 border-gray-800 px-2 py-2 text-center">
                          {hasMaterialData()
                            ? calculateTotal()
                            : dummyMaterials.reduce(
                                (sum, m) => sum + m.jumlah,
                                0
                              )}
                        </td>
                        <td className="border-2 border-gray-800 px-2 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                <div className="pb-3 pl-3 border-b-2 border-gray-800">
                  <div className="text-lg font-semibold">Keterangan :</div>
                </div>
                <div className="py-3 pl-3 border-b-2 border-gray-800">
                  <div className="text-lg font-semibold">
                    {formData.catatanTambahan ||
                      "PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"}
                  </div>
                </div>

                {/* Vehicle and Driver Info */}
                <div className="pl-3 grid grid-cols-2 gap-8 mb-8 text-lg py-3">
                  <div>
                    <div>
                      <span className="font-semibold">Kendaraan</span> :{" "}
                      {formData.informasiKendaraan || "COLT DIESEL / D 8584 HL"}
                    </div>
                    <div>
                      <span className="font-semibold">Pengemudi</span> :{" "}
                      {formData.namaPengemudi || "AYI"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>Bandung, {formatDate(formData.tanggalSurat)}</div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-16 text-center">
                  {/* Penerima */}
                  <div>
                    <div className="mb-2 text-lg">Yang Menerima,</div>
                    <div className="font-bold mb-4 text-lg">
                      {formData.perusahaanPenerima || "GI BANDUNG UTARA"}
                    </div>

                    <div className="h-24 mb-4 flex items-center justify-center">
                      {getPenerimaSignature() ? (
                        <img
                          src={getPenerimaSignature()!}
                          alt="Signature Penerima"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">
                          (Tanda Tangan)
                        </div>
                      )}
                    </div>

                    <div className="text-lg font-bold">
                      {formData.namaPenerima || "PAK RUDI"}
                    </div>
                  </div>

                  {/* Pengirim */}
                  <div className="relative">
                    <div className="mb-2 text-lg">Yang Menyerahkan,</div>
                    <div className="font-bold mb-4 text-lg">
                      {formData.departemenPengirim || "LOGISTIK UPT BANDUNG"}
                    </div>
                    <Image src={`/images/ttd.png`} alt="TTD" width={140} height={140} className="absolute z-0 left-20 bottom-6"/>
                    <div className="h-24 mb-4 flex items-center justify-center">
                      {getPengirimSignature() ? (
                        <img
                          src={getPengirimSignature()!}
                          alt="Signature Pengirim"
                          className="max-h-full max-w-full object-contain z-20"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">
                          (Tanda Tangan)
                        </div>
                      )}
                    </div>

                    <div className="font-bold text-lg">
                      {formData.namaPengirim || "ANDRI SETIAWAN"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
