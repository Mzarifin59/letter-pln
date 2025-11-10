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

export interface Mengetahui {
  id: number;
  departemen_mengetahui: string;
  nama_mengetahui: string;
  ttd_mengetahui: FileAttachment;
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

export interface BeritaBongkaran  {
  id: number;
  documentId: string;
  cop_surat : FileAttachment;
  no_berita_acara: string;
  no_perjanjian_kontrak: string;
  tanggal_kontrak: string;
  perihal: string;
  lokasi_asal: string;
  lokasi_tujuan: string;
  status_surat: string;
  status_entry: string;
  kategori_surat: string;
  createdAt: string;
  updatedAt: string;
  informasi_kendaraan: string;
  nama_pengemudi: string;
  materials: Material[];
  penerima: Penerima;
  pengirim: Pengirim;
  mengetahui: Mengetahui;
  lampiran: FileAttachment[];
  emails: EmailItem[];
}

// Role types
export type UserRole = "Admin" | "Vendor" | "Other";

// Conditional Email Data Interface
export interface EmailData<T extends UserRole = "Admin"> {
  id: number;
  documentId: string;
  subject: string;
  from_department: string;
  to_company: string;
  pesan: string;
  isHaveStatus: boolean;
  createdAt: string;
  updatedAt: string;
  surat_jalan: T extends "Vendor" ? BeritaBongkaran : SuratJalan;
  sender: Sender;
  recipient: Recipient;
  email_statuses: EmailStatus[];
}

// Type aliases untuk kemudahan penggunaan
export type EmailDataAdmin = EmailData<"Admin">;
export type EmailDataVendor = EmailData<"Vendor">;
export type EmailDataOther = EmailData<"Other">;

// Union type untuk fleksibilitas
export type DynamicEmailData = EmailDataAdmin | EmailDataVendor | EmailDataOther;

// Type guard functions untuk runtime checking
export function isVendorEmailData(data: DynamicEmailData): data is EmailDataVendor {
  return "cop_surat" in data.surat_jalan && "no_berita_acara" in data.surat_jalan;
}

export function isAdminEmailData(data: DynamicEmailData): data is EmailDataAdmin {
  return "no_surat_jalan" in data.surat_jalan && "no_surat_permintaan" in data.surat_jalan;
}

// Helper function untuk type-safe access
export function getEmailDataByRole<T extends UserRole>(
  data: EmailData<any>,
  role: T
): EmailData<T> {
  return data as EmailData<T>;
}
