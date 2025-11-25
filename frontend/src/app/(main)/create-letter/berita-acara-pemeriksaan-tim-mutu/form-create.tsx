"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  useEffect,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Plus, Trash2, Eye, StickyNote, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { SignatureType } from "@/lib/surat-jalan/surat-jalan.type";
import { INITIAL_MATERIAL } from "@/lib/surat-jalan/form.constants";
import { FileUtils } from "@/lib/surat-jalan/file.utils";
import { useSuratJalanForm } from "@/lib/surat-jalan/useSuratJalanForm";
import PreviewSection from "@/components/preview-surat";
import { toast } from "sonner";
import { FileAttachment, SuratJalan } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";
import { generateNextSuratNumber } from "@/lib/generate-no-surat";

interface PreviewData {
  upload: string | null;
  signature: string | null;
}

interface FormCreateProps {
  dataSurat: SuratJalan[];
}

export default function FormCreatePemeriksaanPage({
  dataSurat,
}: FormCreateProps) {
  const router = useRouter();
  const { user } = useUserLogin();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const draftId = searchParams.get("id");

  const {
    formData,
    materials,
    signaturePenerima,
    signaturePengirim,
    lampiran,

    setFormData,
    setMaterials,
    setSignaturePenerima,
    setSignaturePengirim,
    setLampiran,
    handleSubmit: submitForm,
  } = useSuratJalanForm();

  const [showPreview, setShowPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const signatureRefPenerima = useRef<SignatureCanvas>(null);
  const signatureRefPengirim = useRef<SignatureCanvas>(null);

  // Load draft data when in edit mode
  const loadDraftData = useCallback(async () => {
    try {
      if (dataSurat) {
        const suratJalan = dataSurat.filter(
          (item) => item.documentId === draftId
        )[0];

        // Populate form data
        setFormData({
          nomorSuratJalan: suratJalan.no_surat_jalan || "",
          nomorSuratPermintaan: suratJalan.no_surat_permintaan || "",
          tanggalSurat: suratJalan.tanggal
            ? new Date(suratJalan.tanggal).toISOString().split("T")[0]
            : "",
          perihal: suratJalan.perihal || "",
          lokasiAsal: suratJalan.lokasi_asal || "",
          lokasiTujuan: suratJalan.lokasi_tujuan || "",
          catatanTambahan: suratJalan.catatan_tambahan || "",
          informasiKendaraan: suratJalan.informasi_kendaraan || "",
          namaPengemudi: suratJalan.nama_pengemudi || "",
          perusahaanPenerima: suratJalan.penerima.perusahaan_penerima || "",
          namaPenerima: suratJalan.penerima.nama_penerima || "",
          departemenPengirim: suratJalan.pengirim.departemen_pengirim || "",
          namaPengirim: suratJalan.pengirim.nama_pengirim || "",
        });

        const getFileUrl = (
          fileAttachment: FileAttachment | null | undefined
        ): string => {
          if (!fileAttachment?.url) return "";
          if (fileAttachment.url.startsWith("http")) return fileAttachment.url;
          return `http://localhost:1337${fileAttachment.url}`;
        };

        if (suratJalan.penerima.ttd_penerima) {
          const signatureUrl = getFileUrl(suratJalan.penerima.ttd_penerima);
          setSignaturePenerima((prev) => ({
            ...prev,
            signature: signatureUrl,
            preview: { ...prev.preview, upload: signatureUrl, signature: null },
          }));
        }

        if (suratJalan.pengirim.ttd_pengirim) {
          const signatureUrl = getFileUrl(suratJalan.pengirim.ttd_pengirim);
          setSignaturePengirim((prev) => ({
            ...prev,
            signature: signatureUrl,
            preview: { ...prev.preview, upload: signatureUrl, signature: null },
          }));
        }

        if (suratJalan.materials && suratJalan.materials.length > 0) {
          const loadedMaterials = suratJalan.materials.map((mat, index) => ({
            id: index + 1,
            namaMaterial: mat.nama || "",
            katalog: mat.katalog || "",
            satuan: mat.satuan || "",
            jumlah: mat.jumlah?.toString() || "0",
            keterangan: mat.keterangan || "",
          }));
          setMaterials(loadedMaterials);
        }

        if (suratJalan.lampiran && suratJalan.lampiran.length > 0) {
          try {
            const loadedLampiran = await Promise.all(
              suratJalan.lampiran.map(async (attachment: FileAttachment) => {
                const fileUrl = getFileUrl(attachment);
                const response = await fetch(fileUrl);
                const blob = await response.blob();
                return new File([blob], attachment.name || "lampiran", {
                  type: blob.type,
                });
              })
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
          description: "Anda dapat melanjutkan mengedit surat jalan",
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
    setSignaturePenerima,
    setSignaturePengirim,
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
  const previewPenerima: PreviewData = {
    upload: signaturePenerima.preview.upload,
    signature: signaturePenerima.preview.signature,
  };

  const previewPengirim: PreviewData = {
    upload: signaturePengirim.preview.upload,
    signature: signaturePengirim.preview.signature,
  };

  // FORM HANDLERS
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const setter =
      type === "penerima" ? setSignaturePenerima : setSignaturePengirim;

    setter((prev) => ({
      ...prev,
      upload: file,
      preview: { ...prev.preview, upload: preview },
    }));
  };

  const saveSignature = (type: SignatureType) => {
    const ref =
      type === "penerima" ? signatureRefPenerima : signatureRefPengirim;
    const setter =
      type === "penerima" ? setSignaturePenerima : setSignaturePengirim;

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
    const ref =
      type === "penerima" ? signatureRefPenerima : signatureRefPengirim;
    const setter =
      type === "penerima" ? setSignaturePenerima : setSignaturePengirim;

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
    const setter =
      type === "penerima" ? setSignaturePenerima : setSignaturePengirim;
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

  // Form validation - mengembalikan error pertama yang ditemukan
  const validateForm = (isDraft: boolean = false) => {
    if (!isDraft) {
      if (!formData.nomorSuratPermintaan) {
        return {
          isValid: false,
          error: "Nomor Surat Permintaan harus diisi",
          field: "nomorSuratPermintaan",
        };
      }
      if (!formData.tanggalSurat) {
        return {
          isValid: false,
          error: "Tanggal Surat harus diisi",
          field: "tanggalSurat",
        };
      }
      if (!formData.perihal.trim()) {
        return {
          isValid: false,
          error: "Perihal harus diisi",
          field: "perihal",
        };
      }
      if (!formData.lokasiAsal.trim()) {
        return {
          isValid: false,
          error: "Lokasi Asal harus diisi",
          field: "lokasiAsal",
        };
      }
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
            "Minimal harus ada 1 material dengan data lengkap (Nama, Katalog, Satuan, dan Jumlah)",
          field: "materials",
        };
      }

      // Validasi informasi pengirim
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

      // Validasi tanda tangan pengirim
      if (!signaturePengirim.upload && !signaturePengirim.signature) {
        return {
          isValid: false,
          error: "Tanda tangan Pengirim harus diisi",
          field: "signaturePengirim",
        };
      }

      // Validasi informasi penerima
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

      // Validasi tanda tangan penerima
      if (!signaturePenerima.upload && !signaturePenerima.signature) {
        return {
          isValid: false,
          error: "Tanda tangan Penerima harus diisi",
          field: "signaturePenerima",
        };
      }
    } else {
      // Untuk draft
      if (!formData.nomorSuratJalan.trim()) {
        return {
          isValid: false,
          error: "Nomor Surat Jalan harus diisi untuk menyimpan draft",
          field: "nomorSuratJalan",
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
      toast.loading(isEditMode ? "Memperbarui surat..." : "Mengirim surat...", {
        id: "submit",
        position: "top-center",
      });

      await submitForm(false);

      setFormData({
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
        departemenPengirim: "",
        namaPengirim: "",
      });

      setLampiran([]);
      setSignaturePenerima({
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      });
      setSignaturePengirim({
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      });
      setMaterials([{ id: 1, ...INITIAL_MATERIAL }]);

      toast.success(
        isEditMode
          ? "Surat berhasil diperbarui 🎉"
          : "Surat berhasil dikirim 🎉",
        {
          id: "submit",
          position: "top-center",
          duration: 3000,
          description: isEditMode
            ? "Perubahan surat jalan telah disimpan dan dikirim."
            : "Surat jalan telah berhasil dikirim ke penerima.",
        }
      );

      sessionStorage.removeItem("draftData");
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
        departemenPengirim: "",
        namaPengirim: "",
      });

      setLampiran([]);
      setSignaturePenerima({
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      });
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
        router.push("/draft");
      }
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

      // Render canvas dengan scale optimal
      const canvas = await html2canvas(page, {
        scale: 2, // Scale lebih tinggi untuk kualitas
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: page.scrollWidth,
        windowHeight: page.scrollHeight,
        width: page.scrollWidth,
        height: page.scrollHeight,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedPage = clonedDoc.querySelector(
            `[data-lembar="${page.getAttribute(
              "data-lembar"
            )}"][data-page="${page.getAttribute("data-page")}"]`
          ) as HTMLElement;
          if (clonedPage) {
            // Pastikan tinggi tetap 297mm
            clonedPage.style.height = "297mm";
            clonedPage.style.maxHeight = "297mm";
            clonedPage.style.overflow = "hidden";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add new page jika bukan halaman pertama
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Tambahkan image dengan ukuran exact A4
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );
    }

    pdf.save(`${formData.nomorSuratJalan || "surat-jalan"}.pdf`);
  };

  // Generate no surat
  useEffect(() => {
    if (mode !== "edit" && !draftId && dataSurat && dataSurat.length >= 0) {
      const autoGeneratedNumber = generateNextSuratNumber(dataSurat);
      setFormData((prev) => ({
        ...prev,
        nomorSuratJalan: autoGeneratedNumber,
      }));
    }
  }, [mode, draftId, dataSurat, setFormData]);

  // Set default tanggal surat
  useEffect(() => {
    if (!formData.tanggalSurat && mode !== "edit" && !draftId) {
      setFormData((prev) => ({
        ...prev,
        tanggalSurat: new Date().toISOString().split("T")[0],
      }));
    }
  }, [mode, draftId, formData.tanggalSurat, setFormData]);

  const renderBasicInformation = () => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Berita Acara
          </label>
          <Input
            type="text"
            name="nomorSuratJalan"
            value={formData.nomorSuratJalan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent bg-gray-50"
            placeholder="NO : 001.SJ/GD.UPT-BDG/IX/2025"
            readOnly={!isEditMode}
          />
        </div>

        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            No Perjanjian Kontrak
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
            Tanggal Kontrak
          </label>
          <div className="relative">
            <input
              type="date"
              name="tanggalSurat"
              value={formData.tanggalSurat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pr-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanggal Pelaksanaan
          </label>
          <input
            type="date"
            name="tanggalSurat"
            value={formData.tanggalSurat}
            onChange={handleInputChange}
            className="w-full px-3 py-2 pr-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-2">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Perihal Kontrak
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

        <div className="sm:col-span-1 lg:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Hasil Pemeriksaan
          </label>
          <select className="w-full px-2 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white">
            <option value="Diterima" className="">
              DITERIMA
            </option>
            <option value="Ditolak">DITOLAK</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B0] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Form...</p>
        </div>
      </div>
    );
  }

  const renderKelengkapanSection = () => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-6">
        Kelengkapan Dokumen
      </h3>

      {/* Row 1: Dokumen, No Dokumen, Tanggal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dokumen
          </label>
          <input
            type="text"
            defaultValue="Surat Jalan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Surat Jalan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            No Dokumen
          </label>
          <input
            type="text"
            defaultValue="No 09126434321"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="No 09126434321"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal
          </label>
          <input
            type="text"
            defaultValue="No 09126434321"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="No 09126434321"
          />
        </div>
      </div>

      {/* Row 2: Radio Buttons */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-6">2.</span>
        <div className="flex gap-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="jenisGambar"
              value="outline"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Outline</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="jenisGambar"
              value="approval"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Approval Drawing</span>
          </label>
        </div>
      </div>

      {/* Checkbox List */}
      <div className="space-y-3">
        {/* Item 3 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            3.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Buku Instruction Manual dalam bahasa Inggris & Indonesia (Hardcopy &
            Softcopy)
          </span>
        </label>

        {/* Item 4 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            4.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Surat Keterangan Asal Usul Barang
          </span>
        </label>

        {/* Item 5 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            5.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Factory Test Certificate / Routine Test
          </span>
        </label>

        {/* Item 6 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            6.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Technical Particular and Guarantee & Brosur Barang
          </span>
        </label>

        {/* Item 7 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            7.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Certificate of Origin (COO)
          </span>
        </label>

        {/* Item 8 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            8.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Certificate of Manufacture (COM)
          </span>
        </label>

        {/* Item 9 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            9.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            ISO 9001 Dan ISO 14001 dari pabrikan yang masih berlaku
          </span>
        </label>

        {/* Item 10 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            10.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Copy Result of Inspection and test (COA)
          </span>
        </label>

        {/* Item 11 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            11.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Surat Pernyataan Garansi Barang
          </span>
        </label>

        {/* Item 12 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            12.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Surat Pernyataan 100% Barang Baru dan Asli
          </span>
        </label>

        {/* Item 13 */}
        <label className="flex items-start cursor-pointer group">
          <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
            13.
          </span>
          <div className="flex items-center h-6 mr-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-700">
            Surat Pernyataan dari penyedia /Pabrikan yang menyatakan bertanggung
            jawab bahwa barang yang disupply tersebut dalam keadan baik bisa di
            gunakan oleh pihak PLN.
          </span>
        </label>

        {/* Item 14 - Dokumen Lainnya */}
        <div className="pt-2">
          <div className="flex items-start gap-0 mb-2">
            <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
              14.
            </span>
            <div className="flex items-center h-6 mr-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <label className="text-sm font-medium text-gray-700">
              Dokumen Lainnya
            </label>
          </div>
          <input
            type="text"
            placeholder="Input dokumen lainnya"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ml-9"
            style={{ marginLeft: "2.25rem" }}
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
                Merek
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Tipe
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Satuan
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Jumlah
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-sm font-semibold text-[#232323]">
                Lokasi
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
                    placeholder="Lokasi"
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
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="Kg">Kg (Kilogram)</option>
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
                    placeholder="Lokasi"
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
              <td colSpan={4}></td>
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
    personTitle: string,
    ttdTitle: string,
    perusahaanValue: string,
    namaValue: string,
    perusahaanName: string,
    namaNama: string,
    preview: PreviewData,
    isShowTitle: boolean
  ) => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      {isShowTitle && (
        <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-4">
          {title}
        </h3>
      )}

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
            Nama {personTitle}
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
            Tanda Tangan {ttdTitle}
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

  if (showPreview) {
    return (
      <div className="lg:ml-72">
        <PreviewSection
          formData={formData}
          materials={materials}
          signaturePenerima={signaturePenerima}
          signaturePengirim={signaturePengirim}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          onDraft={handleDraft}
          onDownloadPDF={handleDownloadPDF}
          calculateTotal={calculateTotal}
        />
      </div>
    );
  }

  if (!showPreview) {
    return (
      <>
        <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex flex-col gap-8 lg:gap-12">
          <div className="flex flex-col bg-white rounded-xl shadow-md">
            {/* Header */}
            <div className="flex flex-col xl:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
              <div className="flex items-center gap-3">
                <h1 className="plus-jakarta-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-[#353739]">
                  Buat Berita Acara Pemeriksaan Tim Mutu
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

              {renderKelengkapanSection()}

              {/* Materials Table - Add horizontal scroll on mobile */}
              {renderMaterialsTable()}

              {/* Sender and Receiver Signatures - Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6">
                {renderSignatureSection(
                  "penerima",
                  "Penyedia Barang",
                  "Penanggung Jawab",
                  "Penerima",
                  formData.perusahaanPenerima,
                  formData.namaPenerima,
                  "perusahaanPenerima",
                  "namaPenerima",
                  previewPenerima,
                  true
                )}

                <div className="grid gap-5 ">
                  <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
                    <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-4">
                      Pemeriksa Barang
                    </h3>

                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
                          Departemen Pemeriksa
                        </label>
                        <input
                          type="text"
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={"PT PLN PERSERO"}
                        />
                      </div>
                    </div>
                  </div>
                  {renderSignatureSection(
                    "pengirim",
                    "Mengetahui 1",
                    "Mengetahui 1",
                    "Pengirim",
                    formData.departemenPengirim,
                    formData.namaPengirim,
                    "departemenPengirim",
                    "namaPengirim",
                    previewPengirim,
                    false
                  )}

                  {renderSignatureSection(
                    "pengirim",
                    "Mengetahui 2",
                    "Mengetahui 2",
                    "Pengirim",
                    formData.departemenPengirim,
                    formData.namaPengirim,
                    "departemenPengirim",
                    "namaPengirim",
                    previewPengirim,
                    false
                  )}

                  {renderSignatureSection(
                    "pengirim",
                    "Mengetahui 3",
                    "Mengetahui 3",
                    "Pengirim",
                    formData.departemenPengirim,
                    formData.namaPengirim,
                    "departemenPengirim",
                    "namaPengirim",
                    previewPengirim,
                    false
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
