// API Response Types
export interface FormData {
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
  departemenPengirim: string;
  namaPengirim: string;
}

export interface MaterialForm {
  id: number;
  namaMaterial: string;
  katalog: string;
  satuan: string;
  jumlah: string;
  keterangan: string;
}

export interface SignatureData {
  upload: File | null;
  signature: string | null;
  preview: {
    upload: string | null;
    signature: string | null;
  };
}

export type SignatureType = "penerima" | "pengirim";
