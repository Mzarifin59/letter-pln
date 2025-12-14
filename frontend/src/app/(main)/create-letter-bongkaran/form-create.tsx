"use client";

import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Plus, Trash2, Eye, StickyNote, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { SignatureType } from "@/lib/surat-bongkaran/berita-bongkaran.type";
import { INITIAL_MATERIAL } from "@/lib/surat-bongkaran/form.constants";
import { FileUtils } from "@/lib/surat-bongkaran/file.utils";
import { useBeritaBongkaranForm } from "@/lib/surat-bongkaran/useBeritaBongkaranForm";
import PreviewSection from "@/components/preview-berita-acara";
import { toast } from "sonner";
import { FileAttachment, BeritaBongkaran, User } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { generateNextBeritaAcara } from "@/lib/generate-no-surat";
import PreviewSectionBeritaBongkaran from "@/components/preview-berita-acara";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PreviewData {
  upload: string | null;
  signature: string | null;
}

interface FormCreateProps {
  dataSurat: BeritaBongkaran[];
  users: User[];
}

export default function FormCreatePage({ dataSurat, users }: FormCreateProps) {
  const router = useRouter();
  const { user } = useUserLogin();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const draftId = searchParams.get("id");

  // Filter users berdasarkan role
  const vendorUsers = users.filter((u) => u.role?.name === "Vendor");
  const garduIndukUsers = users.filter((u) => u.role?.name === "Gardu Induk");

  const {
    formData,
    materials,
    signaturePengirim,
    lampiran,

    setFormData,
    setMaterials,
    setSignaturePengirim,
    setLampiran,
    setExistingCopSuratId,
    handleSubmit: submitForm,
  } = useBeritaBongkaranForm();

  const [showPreview, setShowPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copSuratPreview, setCopSuratPreview] = useState<string | null>(null);

  const signatureRefPengirim = useRef<SignatureCanvas>(null);

  // Load draft data when in edit mode
  const loadDraftData = useCallback(async () => {
    try {
      if (dataSurat) {
        const beritaBongkaran = dataSurat.filter(
          (item) => item.documentId === draftId
        )[0];

        const getFileUrl = (
          fileAttachment: FileAttachment | null | undefined
        ): string => {
          if (!fileAttachment?.url) return "";
          if (fileAttachment.url.startsWith("http")) return fileAttachment.url;
          return `${process.env.NEXT_PUBLIC_API_URL}${fileAttachment.url}`;
        };

        if (beritaBongkaran.cop_surat) {
          const copSuratUrl = getFileUrl(beritaBongkaran.cop_surat);
          setCopSuratPreview(copSuratUrl);

          // Set formData.copSurat dengan URL agar preview component bisa menampilkannya
          setFormData((prev) => ({ ...prev, copSurat: copSuratUrl }));

          setExistingCopSuratId(beritaBongkaran.cop_surat.id);
        }

        // Populate form data
        setFormData((prev) => ({
          ...prev,
          nomorBeritaAcara: beritaBongkaran.no_berita_acara || "",
          nomorPerjanjianKontrak: beritaBongkaran.no_perjanjian_kontrak || "",
          tanggalKontrak: beritaBongkaran.tanggal_kontrak
            ? new Date(beritaBongkaran.tanggal_kontrak)
                .toISOString()
                .split("T")[0]
            : "",
          perihal: beritaBongkaran.perihal || "",
          lokasiAsal: beritaBongkaran.lokasi_asal || "",
          lokasiTujuan: beritaBongkaran.lokasi_tujuan || "",
          informasiKendaraan: beritaBongkaran.informasi_kendaraan || "",
          namaPengemudi: beritaBongkaran.nama_pengemudi || "",
          perusahaanPenerima: beritaBongkaran.penerima.perusahaan_penerima,
          namaPenerima: beritaBongkaran.penerima.nama_penerima,
          departemenPengirim:
            beritaBongkaran.pengirim.departemen_pengirim || "",
          namaPengirim: beritaBongkaran.pengirim.nama_pengirim || "",
          departemenMengetahui:
            beritaBongkaran.mengetahui.departemen_mengetahui,
          namaMengetahui: beritaBongkaran.mengetahui.nama_mengetahui,
        }));

        // Load signature pengirim
        if (beritaBongkaran.pengirim.ttd_pengirim) {
          const signatureUrl = getFileUrl(
            beritaBongkaran.pengirim.ttd_pengirim
          );
          setSignaturePengirim((prev) => ({
            ...prev,
            signature: signatureUrl,
            preview: { ...prev.preview, upload: signatureUrl, signature: null },
          }));
        }

        // Load materials
        if (beritaBongkaran.materials && beritaBongkaran.materials.length > 0) {
          const loadedMaterials = beritaBongkaran.materials.map(
            (mat, index) => ({
              id: index + 1,
              namaMaterial: mat.nama || "",
              katalog: mat.katalog || "",
              satuan: mat.satuan || "",
              jumlah: mat.jumlah?.toString() || "0",
              keterangan: mat.keterangan || "",
            })
          );
          setMaterials(loadedMaterials);
        }

        // Load lampiran
        if (beritaBongkaran.lampiran && beritaBongkaran.lampiran.length > 0) {
          try {
            const loadedLampiran = await Promise.all(
              beritaBongkaran.lampiran.map(
                async (attachment: FileAttachment) => {
                  const fileUrl = getFileUrl(attachment);
                  const response = await fetch(fileUrl);
                  const blob = await response.blob();
                  return new File([blob], attachment.name || "lampiran", {
                    type: blob.type,
                  });
                }
              )
            );
            setLampiran(loadedLampiran);
          } catch (error) {
            console.error("Error loading lampiran:", error);
            toast.error("Beberapa lampiran gagal dimuat", {
              position: "top-center",
            });
          }
        }

        toast.success("Data berhasil dimuat", {
          description: "Anda dapat melanjutkan mengedit berita bongkaran",
          position: "top-center",
        });
      } else {
        toast.error("Data tidak ditemukan", { position: "top-center" });
        router.push("/draft");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("Gagal memuat draft", { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  }, [
    router,
    setFormData,
    setLampiran,
    setMaterials,
    setSignaturePengirim,
    setExistingCopSuratId,
  ]);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (mode === "edit" && draftId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsEditMode(true);
      loadDraftData();
    } else if (!mode || !draftId) {
      setIsLoading(false);
    }
  }, [mode, draftId, loadDraftData]);

  // Preview data untuk backward compatibility dengan render functions
  const previewPengirim: PreviewData = {
    upload: signaturePengirim.preview.upload,
    signature: signaturePengirim.preview.signature,
  };

  // FORM HANDLERS
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "file") {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];

      if (file && name === "copSurat") {
        // Set file baru
        setFormData((prev) => ({ ...prev, copSurat: file }));

        // Update preview
        const previewUrl = URL.createObjectURL(file);
        setCopSuratPreview(previewUrl);

        // Clear existing ID karena akan upload file baru
        setExistingCopSuratId(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // MATERIAL HANDLERS
  const addMaterial = () => {
    const newId = Math.max(...materials.map((m) => m.id)) + 1;
    setMaterials((prev) => [...prev, { id: newId, ...INITIAL_MATERIAL }]);
  };

  const removeMaterial = (id: number) => {
    if (materials.length > 1) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleMaterialChange = (id: number, field: string, value: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (parseFloat(m.jumlah) || 0), 0);
  };

  // SIGNATURE HANDLERS
  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    type: SignatureType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileUtils.validate(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const preview = await FileUtils.toBase64(file);
    const setter = setSignaturePengirim;

    setter((prev) => ({
      ...prev,
      upload: file,
      preview: { ...prev.preview, upload: preview },
    }));
  };

  const saveSignature = (type: SignatureType) => {
    const ref = signatureRefPengirim;
    const setter = setSignaturePengirim;

    if (ref.current && !ref.current.isEmpty()) {
      const dataURL = ref.current.toDataURL();
      setter((prev) => ({
        ...prev,
        signature: dataURL,
        preview: { ...prev.preview, signature: dataURL },
      }));
    } else {
      alert("Mohon buat tanda tangan terlebih dahulu");
    }
  };

  const clearSignature = (type: SignatureType) => {
    const ref = signatureRefPengirim;
    const setter = setSignaturePengirim;

    if (ref.current) {
      ref.current.clear();
      setter((prev) => ({
        ...prev,
        signature: null,
        preview: { ...prev.preview, signature: null },
      }));
    }
  };

  const removeUploadedSignature = (type: SignatureType) => {
    const setter = setSignaturePengirim;
    setter((prev) => ({
      ...prev,
      upload: null,
      preview: { ...prev.preview, upload: null },
    }));
  };

  // LAMPIRAN HANDLERS
  const handleFileChangeLampiran = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLampiran((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveLampiran = (index: number) => {
    setLampiran((prev) => prev.filter((_, i) => i !== index));
  };

  // Form validation
  const validateForm = (isDraft: boolean = false) => {
    // Validasi field wajib untuk pengiriman
    if (!isDraft) {
      // Validasi Cop Surat
      if (!formData.copSurat && !copSuratPreview) {
        return {
          isValid: false,
          error: "Cop Surat harus diupload",
          field: "copSurat",
        };
      }

      // Validasi Nomor Berita Acara
      if (!formData.nomorBeritaAcara.trim()) {
        return {
          isValid: false,
          error: "Nomor Berita Acara harus diisi",
          field: "nomorBeritaAcara",
        };
      }

      // Validasi Nomor Perjanjian Kontrak
      if (!formData.nomorPerjanjianKontrak.trim()) {
        return {
          isValid: false,
          error: "Nomor Perjanjian Kontrak harus diisi",
          field: "nomorPerjanjianKontrak",
        };
      }

      // Validasi Tanggal Kontrak
      if (!formData.tanggalKontrak) {
        return {
          isValid: false,
          error: "Tanggal Kontrak harus diisi",
          field: "tanggalKontrak",
        };
      }

      // Validasi Perihal
      if (!formData.perihal.trim()) {
        return {
          isValid: false,
          error: "Perihal harus diisi",
          field: "perihal",
        };
      }

      // Validasi Lokasi Asal
      if (!formData.lokasiAsal.trim()) {
        return {
          isValid: false,
          error: "Lokasi Asal harus diisi",
          field: "lokasiAsal",
        };
      }

      // Validasi Lokasi Tujuan
      if (!formData.lokasiTujuan.trim()) {
        return {
          isValid: false,
          error: "Lokasi Tujuan harus diisi",
          field: "lokasiTujuan",
        };
      }

      // Validasi materials
      const validMaterials = materials.filter(
        (m) =>
          m.namaMaterial.trim() &&
          m.katalog.trim() &&
          m.satuan &&
          parseFloat(m.jumlah) > 0
      );

      if (validMaterials.length === 0) {
        return {
          isValid: false,
          error:
            "Minimal harus ada 1 material dengan data lengkap (Nama, Merk, Satuan, dan Jumlah)",
          field: "materials",
        };
      }

      // Validasi Informasi Kendaraan
      if (!formData.informasiKendaraan.trim()) {
        return {
          isValid: false,
          error: "Informasi Kendaraan harus diisi",
          field: "informasiKendaraan",
        };
      }
      if (!formData.namaPengemudi.trim()) {
        return {
          isValid: false,
          error: "Nama Pengemudi harus diisi",
          field: "namaPengemudi",
        };
      }

      if (!formData.perusahaanPenerima.trim()) {
        return {
          isValid: false,
          error: "Perusahaan Penerima harus diisi",
          field: "perusahaanPenerima",
        };
      }

      if (!formData.namaPenerima.trim()) {
        return {
          isValid: false,
          error: "Nama Penerima harus diisi",
          field: "namaPenerima",
        };
      }

      if (!formData.departemenPengirim.trim()) {
        return {
          isValid: false,
          error: "Departemen Pengirim harus diisi",
          field: "departemenPengirim",
        };
      }

      if (!formData.namaPengirim.trim()) {
        return {
          isValid: false,
          error: "Nama Pengirim harus diisi",
          field: "namaPengirim",
        };
      }
      if (!signaturePengirim.upload && !signaturePengirim.signature) {
        return {
          isValid: false,
          error: "Tanda tangan Pengirim harus diisi",
          field: "signaturePengirim",
        };
      }
      if (!formData.departemenMengetahui.trim()) {
        return {
          isValid: false,
          error: "Departemen Mengetahui harus diisi",
          field: "departemenMengetahui",
        };
      }

      if (!formData.namaMengetahui.trim()) {
        return {
          isValid: false,
          error: "Nama Mengetahui harus diisi",
          field: "namaMengetahui",
        };
      }
    } else {
      if (!formData.nomorBeritaAcara.trim()) {
        return {
          isValid: false,
          error: "Nomor Berita Acara harus diisi untuk menyimpan draft",
          field: "nomorBeritaAcara",
        };
      }
    }

    return { isValid: true };
  };

  // SUBMISSION HANDLERS
  const handleSubmit = async () => {
    const validation = validateForm(false);

    if (!validation.isValid) {
      toast.error(validation.error, {
        position: "top-center",
        duration: 4000,
      });

      const fieldElement = document.querySelector(
        `[name="${validation.field}"]`
      );
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // @ts-ignore
        fieldElement.focus?.();
      }

      return;
    }
    try {
      toast.loading(isEditMode ? "Memperbarui berita bongkaran..." : "Mengirim berita bongkaran...", {
        id: "submit",
        position: "top-center",
      });

      await submitForm(false);

      setFormData({
        copSurat: null,
        nomorBeritaAcara: "",
        nomorPerjanjianKontrak: "",
        tanggalKontrak: "",
        perihal: "",
        lokasiAsal: "",
        lokasiTujuan: "",
        informasiKendaraan: "",
        namaPengemudi: "",
        perusahaanPenerima: "",
        namaPenerima: "",
        departemenPengirim: "",
        namaPengirim: "",
        departemenMengetahui: "",
        namaMengetahui: "",
      });

      setLampiran([]);
      setSignaturePengirim({
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      });
      setMaterials([{ id: 1, ...INITIAL_MATERIAL }]);

      toast.success(
        isEditMode
          ? "Berita Bongkaran berhasil diperbarui 🎉"
          : "Berita Bongkaran berhasil dikirim 🎉",
        {
          id: "submit",
          position: "top-center",
          duration: 3000,
          description: isEditMode
            ? "Perubahan berita bongkaran telah disimpan dan dikirim."
            : "Berita Bongkaran  telah berhasil dikirim ke penerima.",
        }
      );

      // Dispatch event untuk update Header dan Sidebar secara real-time
      if (!isEditMode) {
        window.dispatchEvent(new CustomEvent("emailCreated"));
      }

      sessionStorage.removeItem("draftData");
      router.push("/sent");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan dalam mengirim surat 😢";

      toast.error(message, {
        id: "submit",
        position: "top-center",
      });
    }
  };

  const handleDraft = async () => {
    const validation = validateForm(true);

    if (!validation.isValid) {
      toast.error(validation.error, {
        position: "top-center",
        duration: 4000,
      });
      return;
    }

    try {
      toast.loading(
        isEditMode ? "Memperbarui draft..." : "Menyimpan draft...",
        {
          id: "draft",
          position: "top-center",
        }
      );

      await submitForm(true);

      setFormData({
        copSurat: null,
        nomorBeritaAcara: "",
        nomorPerjanjianKontrak: "",
        tanggalKontrak: "",
        perihal: "",
        lokasiAsal: "",
        lokasiTujuan: "",
        informasiKendaraan: "",
        namaPengemudi: "",
        perusahaanPenerima: "",
        namaPenerima: "",
        departemenPengirim: "",
        namaPengirim: "",
        departemenMengetahui: "",
        namaMengetahui: "",
      });

      setLampiran([]);
      setSignaturePengirim({
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      });
      setMaterials([{ id: 1, ...INITIAL_MATERIAL }]);

      toast.success(
        isEditMode
          ? "Draft berhasil diperbarui 📝"
          : "Draft berhasil disimpan 📝",
        {
          id: "draft",
          position: "top-center",
          duration: 3000,
          description: "Surat jalan disimpan sebagai draft.",
        }
      );

      if (isEditMode) {
        sessionStorage.removeItem("draftData");
      }

      router.push("/draft");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan draft 😢";

      toast.error(message, {
        id: "draft",
        position: "top-center",
      });
    }
  };

  const handlePreviewPDF = () => {
    setShowPreview(true);
  };

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

  const handleDownloadPDF = async () => {
    const pages = document.querySelectorAll(".surat");
    if (!pages.length) return alert("Preview tidak ditemukan!");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    let isFirstPage = true;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      scaleToFit(page);

      // Render canvas dengan scale tinggi untuk kualitas bagus
      const canvas = await html2canvas(page, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowHeight: page.scrollHeight,
        height: page.scrollHeight,
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      // Add new page jika bukan halaman pertama
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Jika tinggi gambar melebihi A4, scale to fit
      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        const scaledHeight = imgHeight * scale;
        const scaledWidth = imgWidth * scale;
        pdf.addImage(imgData, "PNG", 0, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }
    }

    pdf.save(`${formData.nomorBeritaAcara || "surat-jalan"}.pdf`);
  };

  // Generate no surat
  useEffect(() => {
    if (mode !== "edit" && !draftId && dataSurat && dataSurat.length >= 0) {
      const autoGeneratedNumber = generateNextBeritaAcara(dataSurat);
      setFormData((prev) => ({
        ...prev,
        nomorBeritaAcara: autoGeneratedNumber,
      }));
    }
  }, [mode, draftId, dataSurat, setFormData]);

  // Set default tanggal kontrak
  useEffect(() => {
    if (!formData.tanggalKontrak && mode !== "edit" && !draftId) {
      setFormData((prev) => ({
        ...prev,
        tanggalKontrak: new Date().toISOString().split("T")[0],
      }));
    }
  }, [mode, draftId, formData.tanggalKontrak, setFormData]);

  const renderBasicInformation = () => (
    <div className="w-full max-w-full">
      <div className="pb-5">
        <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
          Cop Surat
        </label>

        {copSuratPreview && (
          <div className="mb-3">
            <div className="relative inline-block">
              <img
                src={copSuratPreview}
                alt="Preview Cop Surat"
                className="w-40 h-40 object-contain rounded-lg border-2 border-gray-300 bg-white p-2"
              />
              <button
                type="button"
                onClick={() => {
                  setCopSuratPreview(null);
                  setFormData((prev) => ({ ...prev, copSurat: null }));
                  setExistingCopSuratId(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                title="Hapus gambar"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Klik tombol × untuk menghapus dan upload gambar baru
            </p>
          </div>
        )}

        {!copSuratPreview && (
          <Input
            type="file"
            name="copSurat"
            accept="image/*"
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 h-full text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0056B0] file:text-white hover:file:bg-[#004494] cursor-pointer"
          />
        )}

        {copSuratPreview && (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
            ✓ Cop surat sudah diupload. Hapus gambar di atas untuk menggantinya.
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Berita Acara
          </label>
          <Input
            type="text"
            name="nomorBeritaAcara"
            value={formData.nomorBeritaAcara}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent bg-gray-50"
            placeholder="Contoh: NO : 001.BA/GAE/IX/2025"
            required
          />
        </div>

        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Perjanjian Kontrak
          </label>
          <Input
            type="text"
            name="nomorPerjanjianKontrak"
            value={formData.nomorPerjanjianKontrak}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent"
            placeholder="Contoh: 0018.PJ/DAN.01.03/UPTBDG/2025"
          />
        </div>

        <div className="sm:col-span-2 xl:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanggal
          </label>
          <div className="relative">
            <input
              type="date"
              name="tanggalSurat"
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 pr-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            placeholder="Contoh: SERAH TERIMA MATERIAL BONGKARAN CT, LA, PMT DLL"
            required
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
            required
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contoh: GI CIGERELENG "
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
            required
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contoh: GUDANG CIGERELENG"
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className=" bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B0] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Form...</p>
        </div>
      </div>
    );
  }

  const renderMaterialsTable = () => (
    <div className="w-full max-w-full">
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

      {/* Mobile View - Card Layout (layar < 640px) */}
      <div className="block sm:hidden space-y-4">
        {materials.map((material, index) => (
          <div
            key={material.id}
            className="bg-white border border-[#ADB5BD] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="bg-[#F6F9FF] text-[#232323] font-semibold px-3 py-1 rounded-lg text-sm">
                  #{index + 1}
                </span>
              </div>
              {materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMaterial(material.id)}
                  className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="plus-jakarta-sans block text-xs font-medium text-[#232323] mb-1.5">
                  Nama Material
                </label>
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama Material"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="plus-jakarta-sans block text-xs font-medium text-[#232323] mb-1.5">
                    Merk
                  </label>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Merk"
                  />
                </div>

                <div>
                  <label className="plus-jakarta-sans block text-xs font-medium text-[#232323] mb-1.5">
                    Satuan
                  </label>
                  <select
                    value={material.satuan}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "satuan",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Pilih Satuan</option>
                    <option value="Keping">Keping</option>
                    <option value="PCS ">PCS (Pieces)</option>
                    <option value="Kg ">Kg (Kilogram)</option>
                    <option value="Meter">Meter</option>
                    <option value="Liter">Liter</option>
                    <option value="Bh">Bahan</option>
                    <option value="Set">Set</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="plus-jakarta-sans block text-xs font-medium text-[#232323] mb-1.5">
                    Jumlah
                  </label>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="plus-jakarta-sans block text-xs font-medium text-[#232323] mb-1.5">
                    Keterangan
                  </label>
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Keterangan"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Total Mobile */}
        <div className="bg-[#F6F9FF] border border-[#ADB5BD] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="plus-jakarta-sans font-semibold text-[#232323]">
              TOTAL:
            </span>
            <span className="plus-jakarta-sans font-bold text-lg text-[#232323]">
              {calculateTotal()}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop View - Table Layout (layar >= 640px) */}
      <div className="hidden sm:block w-full max-w-full overflow-x-auto rounded-2xl border border-[#ADB5BD]">
        <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
          <thead className="bg-[#F6F9FF]">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                No
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Nama Material
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Merk
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
                    placeholder="Katalog"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={material.satuan}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "satuan",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Pilih Satuan</option>
                    <option value="Keping">Keping</option>
                    <option value="PCS ">PCS (Pieces)</option>
                    <option value="Kg ">Kg (Kilogram)</option>
                    <option value="Meter">Meter</option>
                    <option value="Liter">Liter</option>  
                    <option value="Bh">Bahan</option>
                    <option value="Set">Set</option>
                    <option value="Unit">Unit</option>
                  </select>
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
                {calculateTotal()}
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
    preview?: PreviewData,
    showSignature: boolean = true
  ) => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-4">
        {title}
      </h3>
      <div className="space-y-4 sm:space-y-6">
        {/* Input Perusahaan */}
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Perusahaan {title}
          </label>
          {type === "pengirim" ? (
            <Select
              value={perusahaanValue || undefined}
              onValueChange={(value) => {
                const selectedUser = vendorUsers.find((u) => u.name === value);
                if (selectedUser) {
                  setFormData((prev) => ({
                    ...prev,
                    [perusahaanName]: selectedUser.name,
                  }));
                }
              }}
            >
              <SelectTrigger className="w-full text-sm sm:text-base">
                <SelectValue placeholder="Pilih Perusahaan Pengirim" />
              </SelectTrigger>
              <SelectContent>
                {vendorUsers.length > 0 ? (
                  vendorUsers.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-data" disabled>
                    Tidak ada data Vendor
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : type === "mengetahui" ? (
            <Select
              value={perusahaanValue || undefined}
              onValueChange={(value) => {
                const selectedUser = garduIndukUsers.find((u) => u.name === value);
                if (selectedUser) {
                  setFormData((prev) => ({
                    ...prev,
                    [perusahaanName]: selectedUser.name,
                  }));
                }
              }}
            >
              <SelectTrigger className="w-full text-sm sm:text-base">
                <SelectValue placeholder="Pilih Perusahaan Mengetahui" />
              </SelectTrigger>
              <SelectContent>
                {garduIndukUsers.length > 0 ? (
                  garduIndukUsers.map((gi) => (
                    <SelectItem key={gi.id} value={gi.name}>
                      {gi.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-data" disabled>
                    Tidak ada data Gardu Induk
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <input
              type="text"
              name={perusahaanName}
              value={perusahaanValue}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                type === "penerima" ? "Contoh: UPT Logistik Bandung" : "Contoh: PT PANDAN WANGI SAE"
              }
            />
          )}
        </div>

        {/* Input Nama */}
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
            placeholder={type === "penerima" ? "Nama Penerima" : type === "pengirim" ? "Nama Pengirim" : "Nama Mengetahui"}
          />
        </div>

        {showSignature && (
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

              {/* Tab Upload */}
              <TabsContent value="upload" className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, type)}
                  className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {preview?.upload ? (
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

              {/* Tab Draw */}
              <TabsContent value="draw" className="space-y-3">
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white h-32 sm:h-40">
                  <SignatureCanvas
                    ref={signatureRefPengirim}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-full",
                      style: { touchAction: "none" },
                    }}
                    backgroundColor="transparent"
                    onEnd={() => saveSignature(type)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => clearSignature(type)}
                    className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                  >
                    🗑️ Hapus
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveSignature(type)}
                    className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                  >
                    💾 Simpan
                  </Button>
                </div>
                <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {preview?.signature ? (
                    <img
                      src={preview.signature}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs sm:text-sm text-center px-2">
                      ✍️ Preview Signature
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttachmentSection = () => (
    <div className="flex flex-col bg-white rounded-xl shadow-md w-full max-w-full">
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

                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        )}

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

  if (showPreview) {
    return (
      <div className="">
        <PreviewSectionBeritaBongkaran
          formData={formData}
          materials={materials}
          signaturePengirim={signaturePengirim}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          onDraft={handleDraft}
          onDownloadPDF={handleDownloadPDF}
          calculateTotal={calculateTotal}
          lampiran={lampiran}
        />
      </div>
    );
  }

  if (!showPreview) {
    return (
      <>
        <div className="bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex flex-col gap-8 lg:gap-12 overflow-x-hidden max-w-full">
          <div className="flex flex-col bg-white rounded-xl shadow-md w-full">
            {/* Header */}
            <div className="flex flex-col xl:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
              <div className="flex items-center gap-3">
                <h1 className="plus-jakarta-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-[#353739]">
                  Buat Berita Acara Serah Terima Material Bongkaran
                </h1>
              </div>

              {/* Action Buttons - Stack on mobile */}
              <div className="grid grid-cols-3 gap-3 sm:gap-[30px]">
                <button
                  onClick={handlePreviewPDF}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <Eye
                    width={20}
                    height={20}
                    className="text-[#232323] flex-shrink-0"
                  />
                  Preview PDF
                </button>
                <button
                  onClick={handleDraft}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <StickyNote
                    width={18}
                    height={18}
                    className="text-[#232323] flex-shrink-0"
                  />
                  Draft
                </button>
                <button
                  onClick={handleSubmit}
                  className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-white rounded-xl bg-[#0056B0] border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
                >
                  <Send width={18} height={18} className="text-white flex-shrink-0" />
                  Kirim
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
              {/* Basic Information */}
              {renderBasicInformation()}

              {/* Materials Table - Add horizontal scroll on mobile */}
              {renderMaterialsTable()}

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
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Contoh: COLT DIESEL / D 8584 HL"
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
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Contoh: AYI"
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
                  undefined,
                  false
                )}

                {renderSignatureSection(
                  "pengirim",
                  "Pengirim",
                  formData.departemenPengirim,
                  formData.namaPengirim,
                  "departemenPengirim",
                  "namaPengirim",
                  previewPengirim
                )}

                {renderSignatureSection(
                  "mengetahui",
                  "Mengetahui",
                  formData.departemenMengetahui,
                  formData.namaMengetahui,
                  "departemenMengetahui",
                  "namaMengetahui",
                  undefined,
                  false
                )}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          {renderAttachmentSection()}
        </div>
      </>
    );
  }
}
