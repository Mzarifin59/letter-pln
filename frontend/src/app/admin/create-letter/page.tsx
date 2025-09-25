"use client";

import { useState, useRef, ChangeEvent, JSX } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Plus,
  Trash2,
  Calendar,
  Eye,
  StickyNote,
  Send,
  X,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Types
interface FormData {
  nomorSuratJalan: string;
  nomorSuratPermintaan: string;
  tanggalSurat: string;
  perihal: string;
  lokasiAsal: string;
  lokasiTujuan: string;
  catatanTambahan: string;
  informasiKendaraan: string;
  namaPengemudi: string;
  perusahaanPenerima: string;
  namaPenerima: string;
  perusahaanPengirim: string;
  namaPengirim: string;
  uploadTTDPenerima: File | null;
  signatureDataPenerima: string | null;
  uploadTTDPengirim: File | null;
  signatureDataPengirim: string | null;
}

interface Material {
  id: number;
  namaMaterial: string;
  katalog: string;
  satuan: string;
  jumlah: string;
  keterangan: string;
}

interface PreviewData {
  upload: string | null;
  signature: string | null;
}

type SignatureType = "penerima" | "pengirim";

// Constants
const INITIAL_FORM_DATA: FormData = {
  nomorSuratJalan: "",
  nomorSuratPermintaan: "",
  tanggalSurat: "",
  perihal: "",
  lokasiAsal: "",
  lokasiTujuan: "",
  catatanTambahan: "",
  informasiKendaraan: "",
  namaPengemudi: "",
  perusahaanPenerima: "",
  namaPenerima: "",
  perusahaanPengirim: "",
  namaPengirim: "",
  uploadTTDPenerima: null,
  signatureDataPenerima: null,
  uploadTTDPengirim: null,
  signatureDataPengirim: null,
};

const INITIAL_MATERIAL: Omit<Material, "id"> = {
  namaMaterial: "",
  katalog: "",
  satuan: "",
  jumlah: "",
  keterangan: "",
};

const FILE_VALIDATION = {
  validTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  maxSize: 5 * 1024 * 1024, // 5MB
};

export default function CreateLetterPage() {
  // State Management
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, ...INITIAL_MATERIAL },
  ]);
  const [previewPenerima, setPreviewPenerima] = useState<PreviewData>({
    upload: null,
    signature: null,
  });
  const [previewPengirim, setPreviewPengirim] = useState<PreviewData>({
    upload: null,
    signature: null,
  });
  const [lampiran, setLampiran] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Refs
  const signatureRefPenerima = useRef<SignatureCanvas>(null);
  const signatureRefPengirim = useRef<SignatureCanvas>(null);

  // Event Handlers
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (
    id: number,
    field: keyof Material,
    value: string
  ): void => {
    setMaterials((prev) =>
      prev.map((material) =>
        material.id === id ? { ...material, [field]: value } : material
      )
    );
  };

  const addMaterial = (): void => {
    const newId = Math.max(...materials.map((m) => m.id)) + 1;
    setMaterials((prev) => [...prev, { id: newId, ...INITIAL_MATERIAL }]);
  };

  const removeMaterial = (id: number): void => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
  };

  const validateFile = (file: File): boolean => {
    if (!FILE_VALIDATION.validTypes.includes(file.type)) {
      alert("Hanya file gambar (JPEG, PNG, GIF) yang diizinkan");
      return false;
    }
    if (file.size > FILE_VALIDATION.maxSize) {
      alert("Ukuran file tidak boleh lebih dari 5MB");
      return false;
    }
    return true;
  };

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    type: SignatureType
  ): void => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      if (type === "penerima") {
        setPreviewPenerima((prev) => ({ ...prev, upload: result }));
        setFormData((prev) => ({ ...prev, uploadTTDPenerima: file }));
      } else {
        setPreviewPengirim((prev) => ({ ...prev, upload: result }));
        setFormData((prev) => ({ ...prev, uploadTTDPengirim: file }));
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = (type: SignatureType): void => {
    const ref =
      type === "penerima" ? signatureRefPenerima : signatureRefPengirim;

    if (ref.current) {
      ref.current.clear();

      if (type === "penerima") {
        setPreviewPenerima((prev) => ({ ...prev, signature: null }));
        setFormData((prev) => ({ ...prev, signatureDataPenerima: null }));
      } else {
        setPreviewPengirim((prev) => ({ ...prev, signature: null }));
        setFormData((prev) => ({ ...prev, signatureDataPengirim: null }));
      }
    }
  };

  const saveSignature = (type: SignatureType): void => {
    const ref =
      type === "penerima" ? signatureRefPenerima : signatureRefPengirim;

    if (ref.current && !ref.current.isEmpty()) {
      const dataURL = ref.current.toDataURL();

      if (type === "penerima") {
        setPreviewPenerima((prev) => ({ ...prev, signature: dataURL }));
        setFormData((prev) => ({ ...prev, signatureDataPenerima: dataURL }));
      } else {
        setPreviewPengirim((prev) => ({ ...prev, signature: dataURL }));
        setFormData((prev) => ({ ...prev, signatureDataPengirim: dataURL }));
      }
    } else {
      alert("Mohon buat tanda tangan terlebih dahulu");
    }
  };

  const handleFileChangeLampiran = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLampiran((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveLampiran = (index: number): void => {
    setLampiran((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedSignature = (type: SignatureType): void => {
    if (type === "penerima") {
      setPreviewPenerima((prev) => ({ ...prev, upload: null }));
      setFormData((prev) => ({ ...prev, uploadTTDPenerima: null }));
    } else {
      setPreviewPengirim((prev) => ({ ...prev, upload: null }));
      setFormData((prev) => ({ ...prev, uploadTTDPengirim: null }));
    }
  };

  // Utility Functions
  const calculateTotal = (): number => {
    return materials.reduce((total, material) => {
      const jumlah = parseFloat(material.jumlah) || 0;
      return total + jumlah;
    }, 0);
  };

  // Action Handlers
  const handleSubmit = (): void => {
    console.log("Form Data:", formData);
    console.log("Materials:", materials);
    console.log("Lampiran:", lampiran);
  };

  const handlePreviewPDF = (): void => {
    setShowPreview(true);
  };

  const handleClosePreview = (): void => {
    setShowPreview(false);
  };

  const handleDraft = (): void => {
    console.log("Draft saved");
  };

  const renderBasicInformation = () => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Surat Jalan
          </label>
          <Input
            type="text"
            name="nomorSuratJalan"
            value={formData.nomorSuratJalan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent"
            placeholder="NO : 001.SJ/GD.UPT-BDG/IX/2025"
          />
        </div>

        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Surat Permintaan
          </label>
          <Input
            type="text"
            name="nomorSuratPermintaan"
            value={formData.nomorSuratPermintaan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent"
            placeholder="001.REQ/GD.UPT-BDG/IX/2025"
          />
        </div>

        <div className="sm:col-span-2 xl:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanggal Surat
          </label>
          <div className="relative">
            <input
              type="date"
              name="tanggalSurat"
              value={formData.tanggalSurat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Perihal
          </label>
          <Textarea
            name="perihal"
            value={formData.perihal}
            onChange={handleInputChange}
            placeholder="PEMAKAIAN MATERIAL KABEL KONTROL UNTUK GI BDUTRA BAY TRF #3"
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Lokasi Asal
          </label>
          <input
            type="text"
            name="lokasiAsal"
            value={formData.lokasiAsal}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="STORAGE POU EK HATI 00"
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Lokasi Tujuan
          </label>
          <input
            type="text"
            name="lokasiTujuan"
            value={formData.lokasiTujuan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="TK PERMATA 17 UTARA"
          />
        </div>
      </div>
    </div>
  );

  const renderMaterialsTable = () => (
    <div>
      <div className="flex max-sm:flex-col sm:items-center justify-between mb-4">
        <h3 className="plus-jakarta-sans text-[26px] font-semibold text-[#353739]">
          Daftar Material
        </h3>
        <button
          type="button"
          onClick={addMaterial}
          className="plus-jakarta-sans max-sm:w-2/5 flex items-center text-base text-[#232323] font-medium gap-2 px-4 py-2 border-2 border-[#EBEBEB] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Material
        </button>
      </div>

      <div className="rounded-2xl border border-[#ADB5BD] overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm md:text-base min-w-[500px]">
          <thead className="bg-[#F6F9FF]">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                No
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Nama Material
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Keterangan
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Satuan
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Jumlah
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Keterangan
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => (
              <tr key={material.id} className="border-t border-gray-200">
                <td className="px-2 sm:px-4 py-2 text-sm text-gray-700">
                  {index + 1}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <Input
                    type="text"
                    value={material.namaMaterial}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "namaMaterial",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama Material"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="text"
                    value={material.katalog}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "katalog",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Keterangan"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="text"
                    value={material.satuan}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "satuan",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="m³"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={material.jumlah}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "jumlah",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="text"
                    value={material.keterangan}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "keterangan",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Keterangan"
                  />
                </td>
                <td className="px-4 py-3">
                  {materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMaterial(material.id)}
                      className="p-1 text-red-600 bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#F6F9FF] border-t border-[#ADB5BD]">
            <tr>
              <td colSpan={3}></td>
              <td className="px-4 py-3 font-semibold text-gray-700">TOTAL:</td>
              <td className="px-4 py-3 font-bold text-lg text-gray-900">
                {calculateTotal().toFixed(1)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const renderSignatureSection = (
    type: SignatureType,
    title: string,
    perusahaanValue: string,
    namaValue: string,
    perusahaanName: string,
    namaNama: string,
    preview: PreviewData
  ) => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-4">
        {title}
      </h3>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Perusahaan {title}
          </label>
          <input
            type="text"
            name={perusahaanName}
            value={perusahaanValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              type === "penerima" ? "GI Bandung Utara" : "Logistik UPT Bandung"
            }
          />
        </div>

        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Nama {title}
          </label>
          <input
            type="text"
            name={namaNama}
            value={namaValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={type === "penerima" ? "Pak Rudi" : "Andri Setiawan"}
          />
        </div>

        <div className="mb-6">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanda Tangan {title}
          </label>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-3 h-auto">
              <TabsTrigger
                value="upload"
                className="text-xs sm:text-sm py-2 px-2 sm:px-4"
              >
                Upload File
              </TabsTrigger>
              <TabsTrigger
                value="draw"
                className="text-xs sm:text-sm py-2 px-2 sm:px-4"
              >
                Gambar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, type)}
                className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {preview.upload ? (
                  <div className="relative w-full h-full">
                    <img
                      src={preview.upload}
                      alt="Preview Tanda Tangan"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeUploadedSignature(type)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 sm:top-2 sm:right-2 sm:h-8 sm:w-8"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 px-4">
                    <div className="mb-2 text-lg sm:text-xl">📁</div>
                    <div className="text-xs sm:text-sm">Preview Upload</div>
                    <div className="text-xs mt-1">
                      Format: JPG, PNG, GIF (Max 5MB)
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="draw" className="space-y-3">
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white h-32 sm:h-40">
                <SignatureCanvas
                  ref={
                    type === "penerima"
                      ? signatureRefPenerima
                      : signatureRefPengirim
                  }
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-full",
                    style: { touchAction: "none" }, // Better touch support
                  }}
                  backgroundColor="rgba(255,255,255,1)"
                  onEnd={() => saveSignature(type)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => clearSignature(type)}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">🗑️</span>
                  <span className="hidden sm:inline">Hapus</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveSignature(type)}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">💾</span>
                  <span className="hidden sm:inline">Simpan</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
              <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {preview.signature ? (
                  <img
                    src={preview.signature}
                    alt="Signature Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-xs sm:text-sm text-center px-2">
                    <span className="block mb-1">✍️</span>
                    Preview Signature
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const renderAttachmentSection = () => (
    <div className="flex flex-col bg-white rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center gap-3">
          <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739]">
            Lampiran
          </h3>
        </div>
        <div className="flex gap-4 sm:gap-[30px]">
          <label
            htmlFor="lampiran"
            className="plus-jakarta-sans flex items-center text-sm sm:text-base text-[#232323] font-medium gap-2 px-3 sm:px-4 py-2 border-2 border-[#EBEBEB] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Lampiran</span>
            <span className="sm:hidden">Tambah</span>
          </label>
          <input
            id="lampiran"
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChangeLampiran}
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <p className="plus-jakarta-sans items-center text-sm sm:text-base text-[#232323] font-medium mb-4">
          Tambahkan Lampiran
        </p>

        {lampiran.length === 0 ? (
          <label
            htmlFor="lampiran"
            className="w-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3">📎</div>
              <p className="plus-jakarta-sans text-sm sm:text-base text-gray-500 font-medium mb-1">
                Belum Ada Lampiran
              </p>
              <p className="plus-jakarta-sans text-xs sm:text-sm text-gray-400">
                Klik untuk menambahkan gambar atau PDF
              </p>
            </div>
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lampiran.map((file, index) => (
              <div
                key={index}
                className="relative border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {file.type.startsWith("image/") ? (
                  <div className="w-full">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 sm:h-32 object-cover rounded-md mb-2"
                    />
                    <p className="text-xs text-gray-600 text-center truncate px-1">
                      {file.name}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-24 sm:h-32 flex flex-col items-center justify-center bg-gray-200 rounded-md mb-2">
                    <div className="text-2xl sm:text-3xl mb-1">📄</div>
                    <p className="text-xs text-gray-600 text-center truncate px-2">
                      {file.name}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveLampiran(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                  aria-label="Hapus lampiran"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                {/* File size indicator */}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File info section */}
        {lampiran.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  {lampiran.length} file(s) terlampir
                </p>
                <p className="text-xs">
                  Total ukuran:{" "}
                  {(
                    lampiran.reduce((total, file) => total + file.size, 0) /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Preview Component
  const renderPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-[90vh]">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">
              Preview Surat
            </h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Kirim
              </button>
              <button
                onClick={handleDraft}
                className="plus-jakarta-sans px-[18px] py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center cursor-pointer"
              >
                <StickyNote width={20} height={20} className="text-[#232323]" />
                Draft
              </button>
              <button
                onClick={handlePreviewPDF}
                className="plus-jakarta-sans px-[18px] py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center cursor-pointer"
              >
                <Download width={24} height={24} className="text-[#232323]" />
                Download PDF
              </button>
              <button
                onClick={handleClosePreview}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="bg-[#F6F9FF] p-8">
            {/* Card */}
            <div className="bg-white shadow-lg p-8">
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
                  <div className="plus-jakarta-sans text-base text-[#232323]">
                    Jl. Soekarno-Hatta No. 606 Bandung 40286
                  </div>
                </div>
                <div className="ml-auto bg-[#A623441A] px-6 py-2 rounded-lg border border-[#A62344]">
                  <div className="plus-jakarta-sans text-[22px] font-bold text-[#A62344]">
                    LEMBAR I
                  </div>
                  <div className="plus-jakarta-sans text-xl text-[#A62344]">
                    Pengirim Barang
                  </div>
                </div>
              </div>

              <hr className="border-t-2 border-gray-200 mb-6" />
              <hr className="border-t-4 border-gray-800 mb-6" />

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  SURAT JALAN
                </h1>
                <div className="text-blue-600 font-semibold text-2xl">
                  {formData.nomorSuratJalan || "NO : 001.SJ/GD.UPT-BDG/IX/2025"}
                </div>
              </div>

              {/* Form Information */}
              <div className="grid grid-cols-1 gap-8 mb-6 text-sm">
                <div>
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
              </div>

              {/* Materials Table */}
              <div className="mb-3">
                <table className="w-full border-t border-b border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-lg text-center">
                      <th className="border-2 border-gray-800  px-2 py-2">
                        NO
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        NAMA MATERIAL
                      </th>
                      <th className="border-2 border-gray-800 px-2 py-2">
                        KATALOG
                      </th>
                      <th className="border-2 border-gray-800  px-2 py-2">
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
                    {materials.length > 0 &&
                    materials.some(
                      (m) =>
                        m.namaMaterial ||
                        m.katalog ||
                        m.satuan ||
                        m.jumlah ||
                        m.keterangan
                    ) ? (
                      materials.map((material, index) => (
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
                    ) : (
                      <>
                        <tr>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            1
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            KABEL KONTROL 4X4 MM2
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            V0 block
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            M
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            47
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            MK-051
                          </td>
                        </tr>
                        <tr>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            2
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            KABEL KONTROL 4X4 MM2
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            -
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            M
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            30
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            MK-052
                          </td>
                        </tr>
                        <tr>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            3
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2">
                            KABEL KONTROL 4X4 MM2
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            -
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            M
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            115
                          </td>
                          <td className="border-2 border-gray-800 px-2 py-2 text-center">
                            MK-PANEL AC/DB
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-gray-100 font-semibold">
                      <td
                        colSpan={4}
                        className="border-2 border-gray-800 px-2 py-2 text-center"
                      >
                        TOTAL
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2 text-center">
                        {materials.length > 0 && materials.some((m) => m.jumlah)
                          ? calculateTotal()
                          : "192"}
                      </td>
                      <td className="border-2 border-gray-800 px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="pb-3 pl-3 text-sm flex items-center gap-3 border-b-2 border-gray-800">
                <div className="text-lg font-semibold">Keterangan :</div>
              </div>
              <div className="py-3 pl-3 text-sm flex items-center gap-3 border-b-2 border-gray-800">
                <div className="mt-1 text-lg font-semibold">
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
                  <div>
                    Bandung,{" "}
                    {formData.tanggalSurat
                      ? new Date(formData.tanggalSurat).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" }
                        )
                      : "31 Januari 2025"}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-16 text-sm text-center">
                <div>
                  <div className="mb-2 text-lg">Yang Menerima,</div>
                  <div className="font-bold mb-4 text-lg">
                    {formData.perusahaanPenerima || "PT PANDAN WANGI SAE"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-center">
                    {previewPenerima.signature ? (
                      <img
                        src={previewPenerima.signature}
                        alt="Signature"
                        className="max-h-full max-w-full"
                      />
                    ) : previewPenerima.upload ? (
                      <img
                        src={previewPenerima.upload}
                        alt="Signature"
                        className="max-h-full max-w-full"
                      />
                    ) : (
                      <div></div>
                    )}
                  </div>

                  <div className="text-lg font-bold">
                    {formData.namaPenerima || "PAK JIMBO"}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-lg">Yang menyerahkan,</div>
                  <div className="font-bold mb-4 text-lg">
                    {formData.perusahaanPengirim || "LOGISTIK UPT BANDUNG"}
                  </div>

                  {/* Signature Preview */}
                  <div className="h-20 mb-4 flex items-center justify-center">
                    {previewPengirim.signature ? (
                      <img
                        src={previewPengirim.signature}
                        alt="Signature"
                        className="max-h-full max-w-full"
                      />
                    ) : previewPengirim.upload ? (
                      <img
                        src={previewPengirim.upload}
                        alt="Signature"
                        className="max-h-full max-w-full"
                      />
                    ) : (
                      <div></div>
                    )}
                  </div>

                  <div className="font-bold text-lg">
                    {formData.namaPengirim || "ANDRI SETIAWAN"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!showPreview) {
    return (
      <>
        <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex flex-col gap-8 lg:gap-12">
          <div className="flex flex-col bg-white rounded-xl shadow-md">
            {/* Header */}
            <div className="flex flex-col xl:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
              <div className="flex items-center gap-3">
                <h1 className="plus-jakarta-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-[#353739]">
                  Buat Surat Jalan
                </h1>
              </div>

              {/* Action Buttons - Stack on mobile */}
              <div className="grid grid-cols-3 gap-3 sm:gap-[30px]">
                <button
                  onClick={handlePreviewPDF}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <Eye width={20} height={20} className="text-[#232323]" />
                  Preview PDF
                </button>
                <button
                  onClick={handleDraft}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <StickyNote
                    width={18}
                    height={18}
                    className="text-[#232323]"
                  />
                  Draft
                </button>
                <button
                  onClick={handleSubmit}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-white rounded-xl bg-[#0056B0] border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <Send width={18} height={18} className="text-white" />
                  Kirim
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Basic Information */}
              {renderBasicInformation()}

              {/* Materials Table - Add horizontal scroll on mobile */}
              {renderMaterialsTable()}

              {/* Additional Notes */}
              <div>
                <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
                  Catatan Tambahan
                </label>
                <Textarea
                  name="catatanTambahan"
                  value={formData.catatanTambahan}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="PENGIRIMAN MATERIAL PASIR, KORAL, DLL UNTUK IN-SITU BETON BAT PB 04"
                />
              </div>

              {/* Driver Information - Responsive Grid */}
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
                      Informasi Kendaraan
                    </label>
                    <input
                      type="text"
                      name="informasiKendaraan"
                      value={formData.informasiKendaraan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="COLT DIESEL / D 8584 HL"
                    />
                  </div>
                  <div>
                    <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
                      Nama Pengemudi
                    </label>
                    <input
                      type="text"
                      name="namaPengemudi"
                      value={formData.namaPengemudi}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="AYI"
                    />
                  </div>
                </div>
              </div>

              {/* Sender and Receiver Signatures - Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6">
                {renderSignatureSection(
                  "penerima",
                  "Penerima",
                  formData.perusahaanPenerima,
                  formData.namaPenerima,
                  "perusahaanPenerima",
                  "namaPenerima",
                  previewPenerima
                )}

                {renderSignatureSection(
                  "pengirim",
                  "Pengirim",
                  formData.perusahaanPengirim,
                  formData.namaPengirim,
                  "perusahaanPengirim",
                  "namaPengirim",
                  previewPengirim
                )}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {renderAttachmentSection()}
        </div>
      </>
    );
  } else {
    return (
      <>
        {/* Preview Modal */}
        <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex flex-col gap-8 lg:gap-12">
          {renderPreview()}
        </div>
      </>
    );
  }
}
