import { useState } from "react";
import qs from "qs";
import { FileUtils } from "@/lib/surat-jalan/file.utils";
import { StrapiAPIService } from "@/lib/surat-jalan/strapi.service";
import {
  FormData,
  MaterialForm,
  SignatureData,
} from "@/lib/surat-jalan/surat-jalan.type";
import {
  INITIAL_FORM_DATA,
  INITIAL_MATERIAL,
} from "@/lib/surat-jalan/form.constants";
import { SuratJalan } from "../interface";
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

export const useSuratJalanForm = () => {
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
  const [lampiran, setLampiran] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserLogin();

  /**
   * Prepare data untuk submission ke Strapi
   */
  const prepareSubmissionData = async (isDraft = false) => {
    try {
      // Upload lampiran files
      const lampiranIds: number[] = [];
      if (lampiran.length > 0) {
        const uploadedLampiran = await StrapiAPIService.uploadFiles(lampiran);
        const validLampiran = uploadedLampiran
          .filter((f) => f && f.id)
          .map((f) => f.id);
        lampiranIds.push(...validLampiran);
      }

      // Upload TTD Penerima
      let ttdPenerimaId = null;
      if (signaturePenerima.upload) {
        const uploaded = await StrapiAPIService.uploadFile(
          signaturePenerima.upload,
          `${formData.namaPenerima}_ttd.png` // Tambahkan custom filename
        );
        ttdPenerimaId = uploaded.id;
      } else if (signaturePenerima.signature) {
        const file = await FileUtils.dataURLToFile(
          signaturePenerima.signature,
          `${formData.namaPenerima}_ttd.png` // Custom filename
        );
        const uploaded = await StrapiAPIService.uploadFile(file);
        ttdPenerimaId = uploaded.id;
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
        no_surat_jalan: formData.nomorSuratJalan,
        no_surat_permintaan: formData.nomorSuratPermintaan,
        tanggal: formData.tanggalSurat,
        perihal: formData.perihal,
        lokasi_asal: formData.lokasiAsal,
        lokasi_tujuan: formData.lokasiTujuan,
        catatan_tambahan: formData.catatanTambahan,
        informasi_kendaraan: formData.informasiKendaraan,
        nama_pengemudi: formData.namaPengemudi,
        status_surat: "In Progress",
        status_entry: isDraft ? "Draft" : "Published",
        kategori_surat : "Surat Jalan",
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
          ttd_penerima: ttdPenerimaId,
        },
        pengirim: {
          departemen_pengirim: formData.departemenPengirim,
          nama_pengirim: formData.namaPengirim,
          ttd_pengirim: ttdPengirimId,
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

      const dataSuratJalan: SuratJalan[] = await getAllSuratJalan();

      if (!isDraft && !formData.nomorSuratJalan) {
        throw new Error("Mohon lengkapi data yang diperlukan");
      }

      const submissionData = await prepareSubmissionData(isDraft);

      // Automate get date now
      const now = new Date().toISOString();
      if (formData.tanggalSurat) {
        const localDate = new Date(formData.tanggalSurat);
        const fullDateTime = new Date(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          new Date().getHours(),
          new Date().getMinutes(),
          new Date().getSeconds()
        ).toISOString();

        submissionData.tanggal = fullDateTime;
      } else {
        submissionData.tanggal = now;
      }

      const existingSurat = dataSuratJalan.find(
        (item) => item.no_surat_jalan === submissionData.no_surat_jalan
      );

      let result;

      if (existingSurat) {
        result = await StrapiAPIService.updateSuratJalan(
          existingSurat.documentId,
          submissionData
        );
      } else {
        result = await StrapiAPIService.createSuratJalan(submissionData);
      }

      // Create Email
      let resultEmail;
      let resultStatusEmail;
      let resultStatusEmailSpv;

      if (existingSurat) {
        result = await StrapiAPIService.updateSuratJalan(
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
            connect: [process.env.NEXT_PUBLIC_SPV_ID],
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

        const dataStatusEmailForSpv = {
          email: {
            connect: [`${resultEmail.data.documentId}`],
          },
          user: {
            connect: [process.env.NEXT_PUBLIC_SPV_ID],
          },
        };

        resultStatusEmail = await StrapiAPIService.createStatusEmail(
          dataStatusEmail
        );

        resultStatusEmailSpv = await StrapiAPIService.createStatusEmail(
          dataStatusEmailForSpv
        );
      }

      return {
        result,
        resultEmail,
        resultStatusEmail,
        resultStatusEmailSpv,
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
    lampiran,
    isSubmitting,

    // Setters
    setFormData,
    setMaterials,
    setSignaturePenerima,
    setSignaturePengirim,
    setLampiran,

    // Methods
    handleSubmit,
  };
};
