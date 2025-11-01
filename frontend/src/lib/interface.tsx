export interface Material {
  id: number;
  nama: string;
  katalog: string;
  satuan: string;
  jumlah: number;
  keterangan: string;
}

export interface FileAttachment {
  id: number;
  documentId: string;
  name: string;
  url: string;
}

export interface Penerima {
  id: number;
  perusahaan_penerima: string;
  nama_penerima: string;
  ttd_penerima: FileAttachment;
}

export interface Pengirim {
  id: number;
  departemen_pengirim: string;
  nama_pengirim: string;
  ttd_pengirim: FileAttachment;
}

export interface Sender {
  id: number;
  documentId: string;
  name: string;
  email: string;
}

export interface Recipient {
  id: number;
  documentId: string;
  name: string | null;
  email: string;
}

// Interface Lampiran
export interface Lampiran {
  id: number;
  documentId: string;
  name: string;
  url: string;
}

export interface EmailStatus{
  id: number;
  documentId: string;
  user: {
    name: string;
    email: string;
  };
  is_read: boolean;
  is_bookmarked: boolean;
  read_at: string;
  bookmarked_at: string;
  isDelete : boolean;
}

export interface EmailItem {
  id: number;
  documentId: string;
  subject: string;
  from_department: string;
  to_company: string;
  pesan: string;
  sender: Sender;
  recipient: Recipient;
}

// Surat Jalan
export interface SuratJalan {
  id: number;
  documentId: string;
  no_surat_jalan: string;
  no_surat_permintaan: string;
  tanggal: string;
  perihal: string;
  lokasi_asal: string;
  lokasi_tujuan: string;
  status_surat: string;
  pesan: string;
  status_entry: string;
  kategori_surat: string;
  createdAt: string;
  updatedAt: string;
  catatan_tambahan: string;
  informasi_kendaraan: string;
  nama_pengemudi: string;
  materials: Material[];
  penerima: Penerima;
  pengirim: Pengirim;
  lampiran: FileAttachment[];
  emails: EmailItem[];
}

export interface EmailData {
  id: number;
  documentId: string;
  subject: string;
  from_department: string;
  to_company: string;
  pesan: string;
  isHaveStatus: boolean;
  createdAt: string;
  updatedAt: string;
  surat_jalan: SuratJalan;
  sender: Sender;
  recipient: Recipient;
  email_statuses: EmailStatus[];
}
