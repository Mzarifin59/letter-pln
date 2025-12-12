import { useState } from "react";
import qs from "qs";
import { FileUtils } from "@/lib/surat-bongkaran/file.utils";
import { StrapiAPIService } from "@/lib/surat-bongkaran/strapi.service";
import {
  FormData,
  MaterialForm,
  SignatureData,
} from "@/lib/surat-bongkaran/berita-bongkaran.type";
import {
  INITIAL_FORM_DATA,
  INITIAL_MATERIAL,
} from "@/lib/surat-bongkaran/form.constants";
import { BeritaBongkaran, User } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";

export async function getAllSuratJalan() {
  const query = qs.stringify({
    sort: ["createdAt:desc"],
    populate: {
      materials: true,
      penerima: {
        fields: ["perusahaan_penerima", "nama_penerima"],
        populate: {
          ttd_penerima: {
            fields: ["name", "url"],
          },
        },
      },
      pengirim: {
        fields: ["departemen_pengirim", "nama_pengirim"],
        populate: {
          ttd_pengirim: {
            fields: ["name", "url"],
          },
        },
      },
      mengetahui: {
        fields: ["departemen_mengetahui", "nama_mengetahui"],
        populate: {
          ttd_mengetahui: {
            fields: ["name", "url"],
          },
        },
      },
      lampiran: {
        fields: ["name", "url"],
      },
      emails: {
        fields: ["subject", "from_department", "to_company", "pesan"],
        populate: {
          sender: {
            fields: ["name", "email"],
          },
          recipient: {
            fields: ["name", "email"],
          },
          attachment_files: true,
        },
      },
    },
  });

  const token = cookieStore.get("token");
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/surat-jalans?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Gagal mengambil data surat jalan");
  const { data } = await res.json();
  return data;
}

async function getAllUsers(): Promise<User[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users?populate=role`,
  );

  if (!res.ok) throw new Error("Gagal mengambil data users");
  const response = await res.json();  
  return response || [];
}

export const useBeritaBongkaranForm = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [materials, setMaterials] = useState<MaterialForm[]>([
    { id: 1, ...INITIAL_MATERIAL },
  ]);
  const [signaturePenerima, setSignaturePenerima] = useState<SignatureData>({
    upload: null,
    signature: null,
    preview: { upload: null, signature: null },
  });
  const [signaturePengirim, setSignaturePengirim] = useState<SignatureData>({
    upload: null,
    signature: null,
    preview: { upload: null, signature: null },
  });
  const [signatureMengetahui, setSignatureMengetahui] = useState<SignatureData>(
    {
      upload: null,
      signature: null,
      preview: { upload: null, signature: null },
    }
  );
  const [lampiran, setLampiran] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCopSuratId, setExistingCopSuratId] = useState<number | null>(
    null
  );

  const { user } = useUserLogin();

  const prepareSubmissionData = async (isDraft = false) => {
    try {
      let copSuratId = existingCopSuratId;
      if (formData.copSurat && formData.copSurat instanceof File) {
        const fileExtension = formData.copSurat.name.split(".").pop() || "png";
        const safeNoBerita = (formData.nomorBeritaAcara || "document")
          .replace(/[\s:\/\\]/g, "_") 
          .replace(/[^\w\-_.]/g, "") 
          .replace(/_{2,}/g, "_"); 

        const safeFilename = `cop_surat_${safeNoBerita}.${fileExtension}`;

        const uploadedCopSurat = await StrapiAPIService.uploadFile(
          formData.copSurat,
          safeFilename
        );
        copSuratId = uploadedCopSurat.id;
      }

      // Upload lampiran files
      const lampiranIds: number[] = [];
      if (lampiran.length > 0) {
        const uploadedLampiran = await StrapiAPIService.uploadFiles(lampiran);
        const validLampiran = uploadedLampiran
          .filter((f) => f && f.id)
          .map((f) => f.id);
        lampiranIds.push(...validLampiran);
      }

      // Upload TTD Pengirim
      let ttdPengirimId = null;
      if (signaturePengirim.upload) {
        const uploaded = await StrapiAPIService.uploadFile(
          signaturePengirim.upload,
          `${formData.namaPengirim}_ttd.png`
        );
        ttdPengirimId = uploaded.id;
      } else if (signaturePengirim.signature) {
        const file = await FileUtils.dataURLToFile(
          signaturePengirim.signature,
          `${formData.namaPengirim}_ttd.png`
        );
        const uploaded = await StrapiAPIService.uploadFile(file);
        ttdPengirimId = uploaded.id;
      }

      // Struktur data sesuai schema Strapi
      return {
        cop_surat: copSuratId, // ✅ Akan berisi existing ID atau ID baru
        no_berita_acara: formData.nomorBeritaAcara,
        no_perjanjian_kontrak: formData.nomorPerjanjianKontrak,
        tanggal_kontrak: formData.tanggalKontrak,
        perihal: formData.perihal,
        lokasi_asal: formData.lokasiAsal,
        lokasi_tujuan: formData.lokasiTujuan,
        informasi_kendaraan: formData.informasiKendaraan,
        nama_pengemudi: formData.namaPengemudi,
        status_surat: "In Progress",
        status_entry: isDraft ? "Draft" : "Published",
        kategori_surat: "Berita Acara Material Bongkaran",
        materials: materials.map((m) => ({
          nama: m.namaMaterial,
          katalog: m.katalog,
          satuan: m.satuan,
          jumlah: parseFloat(m.jumlah) || 0,
          keterangan: m.keterangan,
        })),
        penerima: {
          perusahaan_penerima: formData.perusahaanPenerima,
          nama_penerima: formData.namaPenerima,
        },
        pengirim: {
          departemen_pengirim: formData.departemenPengirim,
          nama_pengirim: formData.namaPengirim,
          ttd_pengirim: ttdPengirimId,
        },
        mengetahui: {
          departemen_mengetahui: formData.departemenMengetahui,
          nama_mengetahui: formData.namaMengetahui,
        },
        lampiran: lampiranIds,
      };
    } catch (error) {
      console.error("Error preparing submission data:", error);
      throw error;
    }
  };

  /**
   * Submit form
   */
  const handleSubmit = async (isDraft = false) => {
    try {
      setIsSubmitting(true);

      const dataBeritaBongkaran: BeritaBongkaran[] = await getAllSuratJalan();

      if (!isDraft && !formData.nomorBeritaAcara) {
        throw new Error("Mohon lengkapi data yang diperlukan");
      }

      const submissionData = await prepareSubmissionData(isDraft);

      // Automate get date now
      const now = new Date().toISOString();
      if (formData.tanggalKontrak) {
        const localDate = new Date(formData.tanggalKontrak);
        const fullDateTime = new Date(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          new Date().getHours(),
          new Date().getMinutes(),
          new Date().getSeconds()
        ).toISOString();

        submissionData.tanggal_kontrak = fullDateTime;
      } else {
        submissionData.tanggal_kontrak = now;
      }

      const users = await getAllUsers();
      const receipt = users.find((user) => user.name === formData.departemenMengetahui);

      const existingSurat = dataBeritaBongkaran.find(
        (item) => item.no_berita_acara === submissionData.no_berita_acara
      );

      let result;

      if (existingSurat) {
        result = await StrapiAPIService.updateBeritaAcara(
          existingSurat.documentId,
          submissionData
        );
      } else {
        result = await StrapiAPIService.createBeritaAcara(submissionData);
      }

      // Create Email
      let resultEmail;
      let resultStatusEmail;
      let resultStatusEmailGI;

      if (existingSurat) {
        result = await StrapiAPIService.updateBeritaAcara(
          existingSurat.documentId,
          submissionData
        );
      } else {
        // Buat email
        const dataEmail = {
          subject: submissionData.perihal,
          from_department: submissionData.pengirim.departemen_pengirim,
          to_company: submissionData.penerima.perusahaan_penerima,
          surat_jalan: {
            connect: [`${result.data.documentId}`],
          },
          sender: {
            connect: [`${user?.documentId}`],
          },
          recipient: {
            connect: [`${receipt?.documentId}`],
          },
        };

        resultEmail = await StrapiAPIService.createEmail(dataEmail);

        // Buat status email
        const dataStatusEmail = {
          email: {
            connect: [`${resultEmail.data.documentId}`],
          },
          user: {
            connect: [`${user?.documentId}`],
          },
        };

        const dataStatusEmailForGI = {
          email: {
            connect: [`${resultEmail.data.documentId}`],
          },
          user: {
            connect: [process.env.NEXT_PUBLIC_GI_ID],
          },
        };

        resultStatusEmail = await StrapiAPIService.createStatusEmail(
          dataStatusEmail
        );

        resultStatusEmailGI = await StrapiAPIService.createStatusEmail(
          dataStatusEmailForGI
        );
      }

      return {
        result,
        resultEmail,
        resultStatusEmail,
        resultStatusEmailGI,
      };
    } catch (error) {
      console.error("Error submitting form:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    formData,
    materials,
    signaturePenerima,
    signaturePengirim,
    signatureMengetahui,
    lampiran,
    isSubmitting,
    existingCopSuratId,

    // Setters
    setFormData,
    setMaterials,
    setSignaturePenerima,
    setSignaturePengirim,
    setSignatureMengetahui,
    setLampiran,
    setExistingCopSuratId,

    // Methods
    handleSubmit,
  };
};
