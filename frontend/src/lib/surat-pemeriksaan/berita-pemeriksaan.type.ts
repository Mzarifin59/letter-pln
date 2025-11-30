// API Response Types
export interface FormData {
  nomorBeritaAcara: string;
  nomorPerjanjianKontrak: string;
  tanggalKontrak: string;
  tanggalPelaksanaan: string;
  perihalKontrak: string;
  hasilPemeriksaan: string;
  kelengkapanDokumen: string;
  perusahaanPenyediaBarang: string;
  namaPenanggungJawab: string;
  departemenPemeriksa: string;
}

export interface MengetahuiForm {
  id: number;
  departemenMengetahui: string;
  namaMengetahui: string;
  signature: SignatureData;
}

export interface PemeriksaBarangForm {
  id: number;
  departemenPemeriksa: string;
  mengetahui: MengetahuiForm[];
}

export interface MaterialForm {
  id: number;
  namaMaterial: string;
  katalog: string;
  satuan: string;
  tipe: string;
  serial_number: string;
  lokasi: string;
  jumlah: string;
}

export interface SignatureData {
  upload: File | null;
  signature: string | null;
  preview: {
    upload: string | null;
    signature: string | null;
  };
}

export type SignatureType = "mengetahui" | "penyedia_barang";
