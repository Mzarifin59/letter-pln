"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  useEffect,
  useCallback,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import {
  SignatureType,
  FormData as FormDataPemeriksaan,
  MaterialForm,
  SignatureData,
  MengetahuiForm,
} from "@/lib/surat-pemeriksaan/berita-pemeriksaan.type";
import { FileUtils } from "@/lib/surat-pemeriksaan/file.utils";
import { useBeritaPemeriksaanForm } from "@/lib/surat-pemeriksaan/useBeritaPemeriksaanForm";
import { BeritaPemeriksaan, FileAttachment } from "@/lib/interface";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, StickyNote, Send } from "lucide-react";
import PreviewBeritaPemeriksaan from "@/components/preview-berita-pemeriksaan";

interface FormCreateProps {
  dataSurat: BeritaPemeriksaan[];
}

// Daftar kelengkapan dokumen
const KELENGKAPAN_DOKUMEN_LIST = [
  { id: 1, label: "Outline", type: "radio", value: "outline" },
  { id: 2, label: "Approval Drawing", type: "radio", value: "approval" },
  {
    id: 3,
    label:
      "Buku Instruction Manual dalam bahasa Inggris & Indonesia (Hardcopy & Softcopy)",
  },
  { id: 4, label: "Surat Keterangan Asal Usul Barang" },
  { id: 5, label: "Factory Test Certificate / Routine Test" },
  { id: 6, label: "Technical Particular and Guarantee & Brosur Barang" },
  { id: 7, label: "Certificate of Origin (COO)" },
  { id: 8, label: "Certificate of Manufacture (COM)" },
  { id: 9, label: "ISO 9001 Dan ISO 14001 dari pabrikan yang masih berlaku" },
  { id: 10, label: "Copy Result of Inspection and test (COA)" },
  { id: 11, label: "Surat Pernyataan Garansi Barang" },
  { id: 12, label: "Surat Pernyataan 100% Barang Baru dan Asli" },
  {
    id: 13,
    label:
      "Surat Pernyataan dari penyedia /Pabrikan yang menyatakan bertanggung jawab bahwa barang yang disupply tersebut dalam keadan baik bisa di gunakan oleh pihak PLN.",
  },
];

export default function FormCreatePemeriksaanPage({
  dataSurat,
}: FormCreateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const draftId = searchParams.get("id");

  const {
    formData,
    materials,
    signaturePenyediaBarang,
    pemeriksaBarang,
    setFormData,
    setMaterials,
    setSignaturePenyediaBarang,
    setPemeriksaBarang,
    handleSubmit: submitForm,
  } = useBeritaPemeriksaanForm();

  // State untuk kelengkapan dokumen
  const [jenisGambar, setJenisGambar] = useState<string>("");
  const [checkedKelengkapan, setCheckedKelengkapan] = useState<Set<number>>(
    new Set()
  );
  const [dokumenLainnya, setDokumenLainnya] = useState<string>("");
  const [dokumenInfo, setDokumenInfo] = useState({
    dokumen: "",
    noDokumen: "",
    tanggal: "",
  });

  // State untuk edit mode dan loading
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Signature Refs
  const signatureRefPenyediaBarang = useRef<SignatureCanvas>(null);
  const signatureRefsMengetahui = useRef<Map<number, SignatureCanvas>>(
    new Map()
  );

  // Fungsi untuk menambah mengetahui baru
  const addMengetahui = () => {
    const newId = Date.now();
    const newMengetahui: MengetahuiForm = {
      id: newId,
      departemenMengetahui: "",
      namaMengetahui: "",
      signature: {
        upload: null,
        signature: null,
        preview: { upload: null, signature: null },
      },
    };

    setPemeriksaBarang((prev) => ({
      ...prev,
      mengetahui: [...prev.mengetahui, newMengetahui],
    }));
  };

  const removeMengetahui = (id: number) => {
    setPemeriksaBarang((prev) => {
      // Jangan hapus jika hanya ada 1 mengetahui
      if (prev.mengetahui.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        mengetahui: prev.mengetahui.filter((m) => m.id !== id),
      };
    });
    signatureRefsMengetahui.current.delete(id);
  };

  // Fungsi untuk convert kelengkapan dokumen ke markdown
  const convertKelengkapanToMarkdown = (
    checkedItems: Set<number>,
    gambarValue: string,
    lainnyaValue: string,
    dokumenInfoValue: { dokumen: string; noDokumen: string; tanggal: string }
  ): string => {
    const items: string[] = [];
    let itemNumber = 1;

    // Tambahkan nomor 1 jika ada data dokumen
    if (
      dokumenInfoValue.dokumen.trim() ||
      dokumenInfoValue.noDokumen.trim() ||
      dokumenInfoValue.tanggal.trim()
    ) {
      const parts: string[] = [];
      if (dokumenInfoValue.dokumen.trim()) {
        parts.push(dokumenInfoValue.dokumen.trim());
      }
      if (dokumenInfoValue.noDokumen.trim()) {
        parts.push(`No ${dokumenInfoValue.noDokumen.trim()}`);
      }
      if (dokumenInfoValue.tanggal.trim()) {
        const date = new Date(dokumenInfoValue.tanggal);
        const formattedDate = date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        parts.push(`Tanggal ${formattedDate}`);
      }
      if (parts.length > 0) {
        items.push(`${itemNumber}. ${parts.join(", ")}`);
        itemNumber++;
      }
    }

    // Tambahkan jenis gambar jika dipilih (nomor 2)
    if (gambarValue) {
      items.push(
        `${itemNumber}. ${
          gambarValue === "outline" ? "Outline" : "Approval Drawing"
        }`
      );
      itemNumber++;
    }

    // Tambahkan checkbox yang dicentang (urutkan berdasarkan id, tapi nomor urut dari itemNumber)
    const sortedIds = Array.from(checkedItems).sort((a, b) => a - b);
    sortedIds.forEach((id) => {
      const item = KELENGKAPAN_DOKUMEN_LIST.find((d) => d.id === id);
      if (item && !item.type) {
        // Skip radio button (id 1 dan 2) dan nomor 1 (sudah ditangani di atas)
        if (id === 14 && lainnyaValue.trim()) {
          items.push(`${itemNumber}. Dokumen Lainnya: ${lainnyaValue.trim()}`);
          itemNumber++;
        } else if (id !== 14 && id !== 1 && id !== 2) {
          items.push(`${itemNumber}. ${item.label}`);
          itemNumber++;
        }
      }
    });

    // Convert ke format tanpa bullet point
    return items.length > 0 ? items.join("\n") : "";
  };

  // Fungsi untuk parse kelengkapan dokumen dari markdown kembali ke state
  const parseKelengkapanFromMarkdown = (markdown: string) => {
    const checkedItems = new Set<number>();
    let gambarValue = "";
    let lainnyaValue = "";
    let parsedDokumenInfo = {
      dokumen: "",
      noDokumen: "",
      tanggal: "",
    };

    if (!markdown) {
      return {
        checkedItems,
        gambarValue,
        lainnyaValue,
        dokumenInfo: parsedDokumenInfo,
      };
    }

    const lines = markdown.split("\n").filter((line) => line.trim());

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Check untuk nomor 1 (dokumen info) - format: "1. Dokumen, No Dokumen, Tanggal"
      if (trimmed.match(/^1\.\s*.+/)) {
        const content = trimmed.replace(/^1\.\s*/, "");
        // Parse format: "Dokumen, No NoDokumen, Tanggal Tanggal"
        const parts = content.split(",").map((p) => p.trim());
        parts.forEach((part) => {
          if (part.startsWith("No ")) {
            parsedDokumenInfo.noDokumen = part.replace(/^No\s+/, "");
          } else if (part.startsWith("Tanggal ")) {
            const dateStr = part.replace(/^Tanggal\s+/, "");
            // Convert Indonesian date format to YYYY-MM-DD
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                parsedDokumenInfo.tanggal = date.toISOString().split("T")[0];
              }
            } catch (e) {
              // Ignore date parsing errors
            }
          } else if (
            part &&
            !part.startsWith("No ") &&
            !part.startsWith("Tanggal ")
          ) {
            // This should be the dokumen name
            parsedDokumenInfo.dokumen = part;
          }
        });
      }

      // Check untuk jenis gambar (Outline atau Approval Drawing)
      if (trimmed.includes("Outline") && !trimmed.includes("1.")) {
        gambarValue = "outline";
        checkedItems.add(2);
      } else if (trimmed.includes("Approval Drawing")) {
        gambarValue = "approval";
        checkedItems.add(2);
      }

      // Check untuk dokumen lainnya
      if (trimmed.includes("Dokumen Lainnya:")) {
        const match = trimmed.match(/Dokumen Lainnya:\s*(.+)/);
        if (match && match[1]) {
          lainnyaValue = match[1].trim();
          checkedItems.add(14);
        }
      }

      // Check untuk item lainnya (3-13) berdasarkan label
      for (let i = 3; i <= 13; i++) {
        const item = KELENGKAPAN_DOKUMEN_LIST.find((d) => d.id === i);
        if (item && trimmed.includes(item.label)) {
          checkedItems.add(i);
          break;
        }
      }
    });

    return {
      checkedItems,
      gambarValue,
      lainnyaValue,
      dokumenInfo: parsedDokumenInfo,
    };
  };

  // Handler untuk checkbox kelengkapan dokumen
  const handleKelengkapanCheckbox = (id: number, checked: boolean) => {
    setCheckedKelengkapan((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      // Update kelengkapanDokumen di formData dengan state baru
      const markdown = convertKelengkapanToMarkdown(
        newSet,
        jenisGambar,
        dokumenLainnya,
        dokumenInfo
      );
      setFormData((prevFormData) => ({
        ...prevFormData,
        kelengkapanDokumen: markdown,
      }));
      return newSet;
    });
  };

  // Handler untuk radio jenis gambar
  const handleJenisGambarChange = (value: string) => {
    setJenisGambar(value);
    // Update kelengkapanDokumen dengan state baru
    const markdown = convertKelengkapanToMarkdown(
      checkedKelengkapan,
      value,
      dokumenLainnya,
      dokumenInfo
    );
    setFormData((prev) => ({ ...prev, kelengkapanDokumen: markdown }));
  };

  // Handler untuk dokumen lainnya
  const handleDokumenLainnyaChange = (value: string) => {
    setDokumenLainnya(value);
    // Update kelengkapanDokumen dengan state baru
    const markdown = convertKelengkapanToMarkdown(
      checkedKelengkapan,
      jenisGambar,
      value,
      dokumenInfo
    );
    setFormData((prev) => ({ ...prev, kelengkapanDokumen: markdown }));
  };

  // Load draft data when in edit mode
  const loadDraftData = useCallback(async () => {
    try {
      if (dataSurat && draftId) {
        const beritaPemeriksaan = dataSurat.find(
          (item) => item.documentId === draftId
        );

        if (!beritaPemeriksaan) {
          toast.error("Data tidak ditemukan", { position: "top-center" });
          router.push("/draft");
          return;
        }

        // Populate form data
        setFormData({
          nomorBeritaAcara: beritaPemeriksaan.no_berita_acara || "",
          nomorPerjanjianKontrak: beritaPemeriksaan.no_perjanjian_kontrak || "",
          tanggalKontrak: beritaPemeriksaan.tanggal_kontrak
            ? new Date(beritaPemeriksaan.tanggal_kontrak)
                .toISOString()
                .split("T")[0]
            : "",
          tanggalPelaksanaan: beritaPemeriksaan.tanggal_pelaksanaan
            ? new Date(beritaPemeriksaan.tanggal_pelaksanaan)
                .toISOString()
                .split("T")[0]
            : "",
          perihalKontrak: beritaPemeriksaan.perihal_kontrak || "",
          hasilPemeriksaan: beritaPemeriksaan.hasil_pemeriksaan || "",
          kelengkapanDokumen: beritaPemeriksaan.kelengkapan_dokumen || "",
          perusahaanPenyediaBarang:
            beritaPemeriksaan.penyedia_barang?.perusahaan_penyedia_barang || "",
          namaPenanggungJawab:
            beritaPemeriksaan.penyedia_barang?.nama_penanggung_jawab || "",
          departemenPemeriksa:
            beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa || "",
        });

        // Parse kelengkapan dokumen dari markdown
        const parsedKelengkapan = parseKelengkapanFromMarkdown(
          beritaPemeriksaan.kelengkapan_dokumen || ""
        );
        setCheckedKelengkapan(parsedKelengkapan.checkedItems);
        setJenisGambar(parsedKelengkapan.gambarValue);
        setDokumenLainnya(parsedKelengkapan.lainnyaValue);
        setDokumenInfo(parsedKelengkapan.dokumenInfo);

        // Load materials
        if (
          beritaPemeriksaan.materials &&
          beritaPemeriksaan.materials.length > 0
        ) {
          const loadedMaterials = beritaPemeriksaan.materials.map(
            (mat, index) => ({
              id: index + 1,
              namaMaterial: mat.nama || "",
              katalog: mat.katalog || "",
              satuan: mat.satuan || "",
              tipe: (mat as any).tipe || "",
              serial_number: (mat as any).serial_number || "",
              lokasi: (mat as any).lokasi || "",
              jumlah: mat.jumlah?.toString() || "0",
            })
          );
          setMaterials(loadedMaterials);
        }

        // Load signature penyedia barang
        const getFileUrl = (
          fileAttachment: FileAttachment | null | undefined
        ): string => {
          if (!fileAttachment?.url) return "";
          if (fileAttachment.url.startsWith("http")) return fileAttachment.url;
          return `${process.env.NEXT_PUBLIC_API_URL}${fileAttachment.url}`;
        };

        if (beritaPemeriksaan.penyedia_barang?.ttd_penerima) {
          const signatureUrl = getFileUrl(
            beritaPemeriksaan.penyedia_barang.ttd_penerima
          );
          setSignaturePenyediaBarang((prev) => ({
            ...prev,
            signature: signatureUrl,
            preview: { ...prev.preview, upload: signatureUrl, signature: null },
          }));
        }

        // Load mengetahui
        if (
          beritaPemeriksaan.pemeriksa_barang?.mengetahui &&
          beritaPemeriksaan.pemeriksa_barang.mengetahui.length > 0
        ) {
          const loadedMengetahui =
            beritaPemeriksaan.pemeriksa_barang.mengetahui.map((m, index) => {
              const mengetahuiId = Date.now() + index;
              let signaturePreview: { upload: string | null; signature: null } =
                { upload: null, signature: null };

              if (m.ttd_mengetahui) {
                const signatureUrl = getFileUrl(m.ttd_mengetahui);
                signaturePreview = { upload: signatureUrl, signature: null };
              }

              return {
                id: mengetahuiId,
                departemenMengetahui: m.departemen_mengetahui || "",
                namaMengetahui: m.nama_mengetahui || "",
                signature: {
                  upload: null,
                  signature: signaturePreview.upload,
                  preview: signaturePreview,
                },
              };
            });
          setPemeriksaBarang((prev) => ({
            ...prev,
            departemenPemeriksa:
              beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa || "",
            mengetahui: loadedMengetahui,
          }));
        } else {
          // Jika tidak ada mengetahui, tetap update departemenPemeriksa
          setPemeriksaBarang((prev) => ({
            ...prev,
            departemenPemeriksa:
              beritaPemeriksaan.pemeriksa_barang?.departemen_pemeriksa || "",
          }));
        }

        toast.success("Data berhasil dimuat", {
          description:
            "Anda dapat melanjutkan mengedit berita acara pemeriksaan",
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
    draftId,
    dataSurat,
    setFormData,
    setMaterials,
    setSignaturePenyediaBarang,
    setPemeriksaBarang,
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

  // FORM HANDLERS
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePemeriksaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPemeriksaBarang((prev) => ({ ...prev, departemenPemeriksa: value }));
  };

  // Handler untuk submit dan draft
  const handleSubmit = async () => {
    try {
      // Update kelengkapan dokumen sebelum submit dengan state terbaru
      const markdown = convertKelengkapanToMarkdown(
        checkedKelengkapan,
        jenisGambar,
        dokumenLainnya,
        dokumenInfo
      );
      setFormData((prev) => ({ ...prev, kelengkapanDokumen: markdown }));

      // Tunggu state update selesai
      await new Promise((resolve) => setTimeout(resolve, 100));

      toast.loading("Mengirim surat...", {
        id: "submit",
        position: "top-center",
      });

      await submitForm(false);

      toast.success("Surat berhasil dikirim 🎉", {
        id: "submit",
        position: "top-center",
        duration: 3000,
      });

      router.push("/draft");
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
    try {
      // Update kelengkapan dokumen sebelum draft dengan state terbaru
      const markdown = convertKelengkapanToMarkdown(
        checkedKelengkapan,
        jenisGambar,
        dokumenLainnya,
        dokumenInfo
      );
      setFormData((prev) => ({ ...prev, kelengkapanDokumen: markdown }));

      // Tunggu state update selesai
      await new Promise((resolve) => setTimeout(resolve, 100));

      toast.loading("Menyimpan draft...", {
        id: "draft",
        position: "top-center",
      });

      await submitForm(true);

      toast.success("Draft berhasil disimpan 📝", {
        id: "draft",
        position: "top-center",
        duration: 3000,
      });

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

  const handleMengetahuiChange = (
    id: number,
    field: "departemenMengetahui" | "namaMengetahui",
    value: string
  ) => {
    setPemeriksaBarang((prev) => ({
      ...prev,
      mengetahui: prev.mengetahui.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  // MATERIAL HANDLERS
  const addMaterial = () => {
    const newId = Math.max(...materials.map((m) => m.id), 0) + 1;
    setMaterials((prev) => [
      ...prev,
      {
        id: newId,
        namaMaterial: "",
        katalog: "",
        satuan: "",
        tipe: "",
        serial_number: "",
        lokasi: "",
        jumlah: "",
      },
    ]);
  };

  const removeMaterial = (id: number) => {
    if (materials.length > 1) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleMaterialChange = (
    id: number,
    field: keyof MaterialForm,
    value: string
  ) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (parseFloat(m.jumlah) || 0), 0);
  };

  const handlePreviewPDF = () => {
    setShowPreview(true);
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

    pdf.save(`${formData.nomorBeritaAcara || "berita-acara-pemeriksaan"}.pdf`);
  };

  // SIGNATURE HANDLERS - Penyedia Barang
  const handleFileUploadPenyediaBarang = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileUtils.validate(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const preview = await FileUtils.toBase64(file);
    setSignaturePenyediaBarang((prev) => ({
      ...prev,
      upload: file,
      preview: { ...prev.preview, upload: preview },
    }));
  };

  const saveSignaturePenyediaBarang = () => {
    if (
      signatureRefPenyediaBarang.current &&
      !signatureRefPenyediaBarang.current.isEmpty()
    ) {
      const dataURL = signatureRefPenyediaBarang.current.toDataURL();
      setSignaturePenyediaBarang((prev) => ({
        ...prev,
        signature: dataURL,
        preview: { ...prev.preview, signature: dataURL },
      }));
    } else {
      alert("Mohon buat tanda tangan terlebih dahulu");
    }
  };

  const clearSignaturePenyediaBarang = () => {
    if (signatureRefPenyediaBarang.current) {
      signatureRefPenyediaBarang.current.clear();
      setSignaturePenyediaBarang((prev) => ({
        ...prev,
        signature: null,
        preview: { ...prev.preview, signature: null },
      }));
    }
  };

  const removeUploadedSignaturePenyediaBarang = () => {
    setSignaturePenyediaBarang((prev) => ({
      ...prev,
      upload: null,
      preview: { ...prev.preview, upload: null },
    }));
  };

  // SIGNATURE HANDLERS - Mengetahui
  const handleFileUploadMengetahui = async (
    e: ChangeEvent<HTMLInputElement>,
    mengetahuiId: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileUtils.validate(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const preview = await FileUtils.toBase64(file);
    setPemeriksaBarang((prev) => ({
      ...prev,
      mengetahui: prev.mengetahui.map((m) =>
        m.id === mengetahuiId
          ? {
              ...m,
              signature: {
                ...m.signature,
                upload: file,
                preview: { ...m.signature.preview, upload: preview },
              },
            }
          : m
      ),
    }));
  };

  const saveSignatureMengetahui = (mengetahuiId: number) => {
    const ref = signatureRefsMengetahui.current.get(mengetahuiId);
    if (ref && !ref.isEmpty()) {
      const dataURL = ref.toDataURL();
      setPemeriksaBarang((prev) => ({
        ...prev,
        mengetahui: prev.mengetahui.map((m) =>
          m.id === mengetahuiId
            ? {
                ...m,
                signature: {
                  ...m.signature,
                  signature: dataURL,
                  preview: { ...m.signature.preview, signature: dataURL },
                },
              }
            : m
        ),
      }));
    } else {
      alert("Mohon buat tanda tangan terlebih dahulu");
    }
  };

  const clearSignatureMengetahui = (mengetahuiId: number) => {
    const ref = signatureRefsMengetahui.current.get(mengetahuiId);
    if (ref) {
      ref.clear();
      setPemeriksaBarang((prev) => ({
        ...prev,
        mengetahui: prev.mengetahui.map((m) =>
          m.id === mengetahuiId
            ? {
                ...m,
                signature: {
                  ...m.signature,
                  signature: null,
                  preview: { ...m.signature.preview, signature: null },
                },
              }
            : m
        ),
      }));
    }
  };

  const removeUploadedSignatureMengetahui = (mengetahuiId: number) => {
    setPemeriksaBarang((prev) => ({
      ...prev,
      mengetahui: prev.mengetahui.map((m) =>
        m.id === mengetahuiId
          ? {
              ...m,
              signature: {
                ...m.signature,
                upload: null,
                preview: { ...m.signature.preview, upload: null },
              },
            }
          : m
      ),
    }));
  };

  const renderBasicInformation = () => (
    <div>
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
            placeholder="NO : 001.BA/GD.UPT-BDG/IX/2025"
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
              name="tanggalKontrak"
              value={formData.tanggalKontrak}
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
            name="tanggalPelaksanaan"
            value={formData.tanggalPelaksanaan}
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
            name="perihalKontrak"
            value={formData.perihalKontrak}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B0] focus:border-transparent"
            placeholder="Perihal kontrak..."
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Hasil Pemeriksaan
          </label>
          <select
            name="hasilPemeriksaan"
            value={formData.hasilPemeriksaan}
            onChange={handleInputChange}
            className="w-full px-2 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Pilih Hasil</option>
            <option value="Diterima">DITERIMA</option>
            <option value="Ditolak">DITOLAK</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderKelengkapanSection = () => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-6">
        Kelengkapan Dokumen
      </h3>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-6">1.</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dokumen
            </label>
            <input
              type="text"
              value={dokumenInfo.dokumen}
              onChange={(e) => {
                const newDokumenInfo = {
                  ...dokumenInfo,
                  dokumen: e.target.value,
                };
                setDokumenInfo(newDokumenInfo);
                // Update kelengkapanDokumen dengan state baru
                const markdown = convertKelengkapanToMarkdown(
                  checkedKelengkapan,
                  jenisGambar,
                  dokumenLainnya,
                  newDokumenInfo
                );
                setFormData((prev) => ({
                  ...prev,
                  kelengkapanDokumen: markdown,
                }));
              }}
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
              value={dokumenInfo.noDokumen}
              onChange={(e) => {
                const newDokumenInfo = {
                  ...dokumenInfo,
                  noDokumen: e.target.value,
                };
                setDokumenInfo(newDokumenInfo);
                // Update kelengkapanDokumen dengan state baru
                const markdown = convertKelengkapanToMarkdown(
                  checkedKelengkapan,
                  jenisGambar,
                  dokumenLainnya,
                  newDokumenInfo
                );
                setFormData((prev) => ({
                  ...prev,
                  kelengkapanDokumen: markdown,
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="No 09126434321"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={dokumenInfo.tanggal}
              onChange={(e) => {
                const newDokumenInfo = {
                  ...dokumenInfo,
                  tanggal: e.target.value,
                };
                setDokumenInfo(newDokumenInfo);
                // Update kelengkapanDokumen dengan state baru
                const markdown = convertKelengkapanToMarkdown(
                  checkedKelengkapan,
                  jenisGambar,
                  dokumenLainnya,
                  newDokumenInfo
                );
                setFormData((prev) => ({
                  ...prev,
                  kelengkapanDokumen: markdown,
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Radio Buttons (Nomor 2) */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-6">2.</span>
        <div className="flex gap-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="jenisGambar"
              value="outline"
              checked={jenisGambar === "outline"}
              onChange={(e) => handleJenisGambarChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Outline</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="jenisGambar"
              value="approval"
              checked={jenisGambar === "approval"}
              onChange={(e) => handleJenisGambarChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Approval Drawing</span>
          </label>
        </div>
      </div>

      {/* Checkbox List */}
      <div className="space-y-3">
        {/* Item 3-13: Checkbox List */}
        {KELENGKAPAN_DOKUMEN_LIST.filter(
          (item) => item.id >= 3 && item.id <= 13
        ).map((item) => (
          <label
            key={item.id}
            className="flex items-start cursor-pointer group"
          >
            <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
              {item.id}.
            </span>
            <div className="flex items-center h-6 mr-3">
              <input
                type="checkbox"
                checked={checkedKelengkapan.has(item.id)}
                onChange={(e) =>
                  handleKelengkapanCheckbox(item.id, e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-700">{item.label}</span>
          </label>
        ))}

        {/* Item 14 - Dokumen Lainnya */}
        <div className="pt-2">
          <div className="flex items-start gap-0 mb-2">
            <span className="text-sm font-medium text-gray-700 w-6 flex-shrink-0">
              14.
            </span>
            <div className="flex items-center h-6 mr-3">
              <input
                type="checkbox"
                checked={checkedKelengkapan.has(14)}
                onChange={(e) =>
                  handleKelengkapanCheckbox(14, e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <label className="text-sm font-medium text-gray-700">
              Dokumen Lainnya
            </label>
          </div>
          <input
            type="text"
            value={dokumenLainnya}
            onChange={(e) => handleDokumenLainnyaChange(e.target.value)}
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
        <table className="w-full border-collapse text-xs sm:text-sm md:text-base min-w-[800px]">
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
                Serial Number
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
                    value={material.tipe}
                    onChange={(e) =>
                      handleMaterialChange(material.id, "tipe", e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tipe"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="text"
                    value={material.serial_number}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "serial_number",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Serial Number"
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
                    value={material.lokasi}
                    onChange={(e) =>
                      handleMaterialChange(
                        material.id,
                        "lokasi",
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
              <td colSpan={5}></td>
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

  const renderSignatureSectionPenyediaBarang = () => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <h3 className="plus-jakarta-sans text-lg sm:text-xl lg:text-[26px] font-semibold text-[#353739] mb-4">
        Penyedia Barang
      </h3>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Perusahaan Penyedia Barang
          </label>
          <input
            type="text"
            name="perusahaanPenyediaBarang"
            value={formData.perusahaanPenyediaBarang}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="PT ABC"
          />
        </div>

        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Nama Penanggung Jawab
          </label>
          <input
            type="text"
            name="namaPenanggungJawab"
            value={formData.namaPenanggungJawab}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nama Penanggung Jawab"
          />
        </div>

        <div className="mb-6">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanda Tangan
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
                onChange={handleFileUploadPenyediaBarang}
                className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {signaturePenyediaBarang.preview.upload ? (
                  <div className="relative w-full h-full">
                    <img
                      src={signaturePenyediaBarang.preview.upload}
                      alt="Preview Tanda Tangan"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeUploadedSignaturePenyediaBarang}
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
                  ref={signatureRefPenyediaBarang}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-full",
                    style: { touchAction: "none" },
                  }}
                  backgroundColor="transparent"
                  onEnd={saveSignaturePenyediaBarang}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearSignaturePenyediaBarang}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">🗑️</span>
                  <span className="hidden sm:inline">Hapus</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={saveSignaturePenyediaBarang}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">💾</span>
                  <span className="hidden sm:inline">Simpan</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
              <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {signaturePenyediaBarang.preview.signature ? (
                  <img
                    src={signaturePenyediaBarang.preview.signature}
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

  const renderSignatureSectionMengetahui = (
    mengetahui: MengetahuiForm,
    index: number
  ) => (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 relative">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Mengetahui {index + 1}
          </label>
          <input
            type="text"
            value={mengetahui.namaMengetahui}
            onChange={(e) =>
              handleMengetahuiChange(
                mengetahui.id,
                "namaMengetahui",
                e.target.value
              )
            }
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nama Mengetahui"
          />
        </div>

        <div className="mb-6">
          <label className="plus-jakarta-sans block text-sm text-[#232323] mb-2">
            Tanda Tangan
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
                onChange={(e) => handleFileUploadMengetahui(e, mengetahui.id)}
                className="block p-2 w-full text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="h-32 sm:h-40 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {mengetahui.signature.preview.upload ? (
                  <div className="relative w-full h-full">
                    <img
                      src={mengetahui.signature.preview.upload}
                      alt="Preview Tanda Tangan"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        removeUploadedSignatureMengetahui(mengetahui.id)
                      }
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
                  ref={(ref) => {
                    if (ref) {
                      signatureRefsMengetahui.current.set(mengetahui.id, ref);
                    }
                  }}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-full",
                    style: { touchAction: "none" },
                  }}
                  backgroundColor="transparent"
                  onEnd={() => saveSignatureMengetahui(mengetahui.id)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => clearSignatureMengetahui(mengetahui.id)}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">🗑️</span>
                  <span className="hidden sm:inline">Hapus</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveSignatureMengetahui(mengetahui.id)}
                  className="flex-1 text-xs sm:text-sm py-2 px-2 sm:px-4"
                >
                  <span className="mr-1 sm:mr-2">💾</span>
                  <span className="hidden sm:inline">Simpan</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
              <div className="h-20 sm:h-28 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {mengetahui.signature.preview.signature ? (
                  <img
                    src={mengetahui.signature.preview.signature}
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

  if (showPreview) {
    return (
      <PreviewBeritaPemeriksaan
        formData={formData}
        materials={materials}
        signaturePenyediaBarang={signaturePenyediaBarang}
        pemeriksaBarang={pemeriksaBarang}
        onClose={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        onDraft={handleDraft}
        onDownloadPDF={handleDownloadPDF}
        calculateTotal={calculateTotal}
      />
    );
  }

  return (
    <div className="lg:ml-72 bg-[#F6F9FF] p-4 sm:p-6 lg:p-9 flex flex-col gap-8 lg:gap-12">
      <div className="flex flex-col bg-white rounded-xl shadow-md">
        {/* Header */}
        <div className="flex flex-col xl:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="plus-jakarta-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-[#353739]">
              Buat Berita Acara Pemeriksaan Tim Mutu
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 sm:gap-[30px]">
            <button
              onClick={handlePreviewPDF}
              className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
            >
              <Eye width={20} height={20} className="text-[#232323]" />
              Preview
            </button>
            <button
              onClick={handleDraft}
              className="plus-jakarta-sans px-4 sm:px-[18px] py-3 sm:py-3.5 text-[#232323] rounded-xl hover:bg-gray-200 border-2 border-[#EBEBEB] transition-colors flex gap-2.5 items-center justify-center cursor-pointer text-sm sm:text-base"
            >
              <StickyNote width={18} height={18} className="text-[#232323]" />
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

          {/* Materials Table */}
          {renderMaterialsTable()}

          {/* Signatures - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6">
            {renderSignatureSectionPenyediaBarang()}

            <div className="grid gap-5">
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
                      value={pemeriksaBarang.departemenPemeriksa}
                      onChange={handlePemeriksaChange}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="PT PLN PERSERO"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addMengetahui}
                  className="plus-jakarta-sans max-sm:w-2/5 flex items-center text-base text-[#232323] font-medium gap-2 px-4 py-2 border-2 border-[#EBEBEB] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Mengetahui
                </button>
              </div>
              {pemeriksaBarang.mengetahui.map((mengetahui, index) => (
                <div key={mengetahui.id} className="relative">
                  {renderSignatureSectionMengetahui(mengetahui, index)}
                  {pemeriksaBarang.mengetahui.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMengetahui(mengetahui.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
