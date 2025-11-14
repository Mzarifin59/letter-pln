import { FormData, MaterialForm } from "@/lib/surat-bongkaran/berita-bongkaran.type";

export const INITIAL_FORM_DATA: FormData = {
  copSurat: null,
  nomorBeritaAcara: '',
  nomorPerjanjianKontrak: '',
  tanggalKontrak: '',
  perihal: '',
  lokasiAsal: '',
  lokasiTujuan: '',
  informasiKendaraan: '',
  namaPengemudi: '',
  perusahaanPenerima: '',
  namaPenerima: '',
  departemenPengirim: '',
  namaPengirim: '',
  departemenMengetahui : '',
  namaMengetahui: ''
};

export const INITIAL_MATERIAL: Omit<MaterialForm, "id"> = {
  namaMaterial: "",
  katalog: "",
  satuan: "",
  jumlah: "",
  keterangan: "",
};

export const FILE_VALIDATION = {
  validTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  maxSize: 5 * 1024 * 1024, // 5MB
  errorMessages: {
    invalidType: "Hanya file gambar (JPEG, PNG, GIF) yang diizinkan",
    tooLarge: "Ukuran file tidak boleh lebih dari 5MB",
  },
};

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",
  endpoints: {
    suratJalan: "/api/surat-jalans",
    upload: "/api/upload",
  },
};

export const API_CONFIG_EMAIL = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",
  endpoints: {
    email: "/api/emails",
    upload: "/api/upload",
  },
};

export const API_CONFIG_STATUSEMAIL = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",
  endpoints: {
    statusEmail: "/api/email-statuses",
    upload: "/api/upload",
  },
};