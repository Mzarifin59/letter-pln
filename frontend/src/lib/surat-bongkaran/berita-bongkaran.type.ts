// API Response Types
export interface FormData {
  nomorBeritaAcara: string;
  nomorPerjanjianKontrak: string;
  tanggalKontrak: string;
  perihal: string;
  lokasiAsal: string;
  lokasiTujuan: string;
  informasiKendaraan: string;
  namaPengemudi: string;
  perusahaanPenerima: string;
  namaPenerima: string;
  departemenPengirim: string;
  namaPengirim: string;
  departemenMengetahui : string;
  namaMengetahui: string
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

export type SignatureType = "penerima" | "pengirim" | "mengetahui";
