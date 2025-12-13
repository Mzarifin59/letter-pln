import { useState } from "react";
import qs from "qs";
import { FileUtils } from "@/lib/surat-pemeriksaan/file.utils";
import { StrapiAPIService } from "@/lib/surat-pemeriksaan/strapi.service";
import {
  FormData,
  MaterialForm,
  SignatureData,
  MengetahuiForm,
} from "@/lib/surat-pemeriksaan/berita-pemeriksaan.type";
import {
  INITIAL_FORM_DATA,
  INITIAL_MATERIAL,
} from "@/lib/surat-pemeriksaan/form.constants";
import { BeritaPemeriksaan } from "@/lib/interface";
import { useUserLogin } from "@/lib/user";

// Helper untuk get token dari localStorage (client-side)
const getAuthToken = (): string => {
  if (typeof window === "undefined") return "";
  const getCookie = (name: string): string => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) return decodeURIComponent(value);
    }
    return "";
  };
  return getCookie("token");
};

export const useBeritaPemeriksaanForm = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [materials, setMaterials] = useState<MaterialForm[]>([
    { id: 1, ...INITIAL_MATERIAL },
  ]);
  const [signaturePenyediaBarang, setSignaturePenyediaBarang] = useState<SignatureData>({
    upload: null,
    signature: null,
    preview: { upload: null, signature: null },
  });
  const [pemeriksaBarang, setPemeriksaBarang] = useState<{
    departemenPemeriksa: string;
    mengetahui: MengetahuiForm[];
  }>({
    departemenPemeriksa: "",
    mengetahui: [
      {
        id: Date.now(),
        departemenMengetahui: "",
        namaMengetahui: "",
        signature: {
          upload: null,
          signature: null,
          preview: { upload: null, signature: null },
        },
      },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserLogin();

  /**
   * Prepare data untuk submission ke Strapi
   */
  const prepareSubmissionData = async (isDraft = false) => {
    try {
      // Upload TTD Penyedia Barang
      let ttdPenyediaBarangId = null;
      if (signaturePenyediaBarang.upload) {
        const uploaded = await StrapiAPIService.uploadFile(
          signaturePenyediaBarang.upload,
          `${formData.namaPenanggungJawab}_ttd.png`
        );
        ttdPenyediaBarangId = uploaded.id;
      } else if (signaturePenyediaBarang.signature) {
        const file = await FileUtils.dataURLToFile(
          signaturePenyediaBarang.signature,
          `${formData.namaPenanggungJawab}_ttd.png`
        );
        const uploaded = await StrapiAPIService.uploadFile(file);
        ttdPenyediaBarangId = uploaded.id;
      }

      // Upload TTD Mengetahui
      const mengetahuiData = await Promise.all(
        pemeriksaBarang.mengetahui.map(async (m) => {
          let ttdMengetahuiId = null;
          if (m.signature.upload) {
            const uploaded = await StrapiAPIService.uploadFile(
              m.signature.upload,
              `${m.namaMengetahui}_ttd.png`
            );
            ttdMengetahuiId = uploaded.id;
          } else if (m.signature.signature) {
            const file = await FileUtils.dataURLToFile(
              m.signature.signature,
              `${m.namaMengetahui}_ttd.png`
            );
            const uploaded = await StrapiAPIService.uploadFile(file);
            ttdMengetahuiId = uploaded.id;
          }

          return {
            departemen_mengetahui: m.departemenMengetahui,
            nama_mengetahui: m.namaMengetahui,
            ttd_mengetahui: ttdMengetahuiId,
          };
        })
      );

      const departemenPemeriksaValue = pemeriksaBarang.departemenPemeriksa || "PLN";
      console.log("Departemen Pemeriksa:", departemenPemeriksaValue);
      console.log("Pemeriksa Barang Data:", {
        departemen_pemeriksa: departemenPemeriksaValue,
        mengetahui: mengetahuiData,
      });

      // Struktur data sesuai schema Strapi
      return {
        no_berita_acara: formData.nomorBeritaAcara,
        no_perjanjian_kontrak: formData.nomorPerjanjianKontrak,
        tanggal_kontrak: formData.tanggalKontrak,
        tanggal_pelaksanaan: formData.tanggalPelaksanaan,
        perihal_kontrak: formData.perihalKontrak,
        hasil_pemeriksaan: formData.hasilPemeriksaan,
        kelengkapan_dokumen: formData.kelengkapanDokumen,
        status_surat: "In Progress",
        status_entry: isDraft ? "Draft" : "Published",
        kategori_surat: "Berita Acara Pemeriksaan Tim Mutu",
        materials: materials.map((m) => ({
          nama: m.namaMaterial,
          katalog: m.katalog,
          satuan: m.satuan,
          tipe: m.tipe,
          serial_number: m.serial_number,
          lokasi: m.lokasi,
          jumlah: parseFloat(m.jumlah) || 0,
        })),
        penyedia_barang: {
          perusahaan_penyedia_barang: formData.perusahaanPenyediaBarang,
          nama_penanggung_jawab: formData.namaPenanggungJawab,
          ttd_penerima: ttdPenyediaBarangId,
        },
        pemeriksa_barang: {
          departemen_pemeriksa: departemenPemeriksaValue,
          mengetahui: mengetahuiData,
        }
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

      // Fetch data berita pemeriksaan untuk cek duplikasi
      const query = qs.stringify({
        sort: ["createdAt:desc"],
        fields: ["no_berita_acara", "documentId", "status_surat"],
      });

      const token = getAuthToken();
      console.log(token);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/surat-jalans?${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil data berita pemeriksaan");
      const { data } = await res.json();
      const dataBeritaPemeriksaan: BeritaPemeriksaan[] = data;

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

      if (formData.tanggalPelaksanaan) {
        const localDate = new Date(formData.tanggalPelaksanaan);
        const fullDateTime = new Date(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          new Date().getHours(),
          new Date().getMinutes(),
          new Date().getSeconds()
        ).toISOString();

        submissionData.tanggal_pelaksanaan = fullDateTime;
      } else {
        submissionData.tanggal_pelaksanaan = now;
      }

      // Debug: Log data yang akan dikirim
      console.log("📤 Submission Data:", JSON.stringify(submissionData, null, 2));
      console.log("📤 Pemeriksa Barang:", submissionData.pemeriksa_barang);

      const existingSurat = dataBeritaPemeriksaan.find(
        (item) => item.no_berita_acara === submissionData.no_berita_acara
      );

      let result;

      if (existingSurat) {
        // Cek kondisi khusus SEBELUM update berita pemeriksaan:
        // jika isHaveStatus true dan status_surat Reject, maka reset status email dan email-status
        const emailsResponse = await StrapiAPIService.getEmailsByBeritaPemeriksaan(
          existingSurat.documentId
        );
        const emails = Array.isArray(emailsResponse.data)
          ? emailsResponse.data
          : emailsResponse.data
          ? [emailsResponse.data]
          : [];

        // Simpan status_surat sebelum update
        const previousStatusSurat = existingSurat.status_surat;
        
        console.log("🔍 Debug Reset Email - Berita Pemeriksaan:", {
          documentId: existingSurat.documentId,
          previousStatusSurat,
          emailsCount: emails.length,
          emails: emails.map((e: any) => ({
            documentId: e.documentId,
            isHaveStatus: e.isHaveStatus,
            email_statuses_count: e.email_statuses?.length || 0,
          })),
        });

        // Update berita pemeriksaan
        result = await StrapiAPIService.updateBeritaPemeriksaan(
          existingSurat.documentId,
          submissionData
        );

        // Loop semua email yang terkait dengan berita pemeriksaan ini
        for (const email of emails) {
          // Cek apakah email.isHaveStatus === true dan status_surat sebelumnya adalah "Reject"
          if (
            email.isHaveStatus === true &&
            previousStatusSurat === "Reject"
          ) {
            console.log("🔄 Resetting email:", email.documentId);
            
            // Update email.isHaveStatus menjadi false
            await StrapiAPIService.updateEmail(email.documentId, {
              isHaveStatus: false,
            });

            // Update semua email-status yang berelasi dengan email tersebut
            // Set is_read menjadi false
            if (email.email_statuses && email.email_statuses.length > 0) {
              const updatePromises = email.email_statuses.map(
                (emailStatus: any) =>
                  StrapiAPIService.updateEmailStatus(
                    emailStatus.documentId || emailStatus.id,
                    { is_read: false }
                  )
              );
              await Promise.all(updatePromises);
              console.log("✅ Email statuses reset:", email.email_statuses.length);
            }
          }
        }
      } else {
        result = await StrapiAPIService.createBeritaPemeriksaan(submissionData);
      }

      // Create Email
      let resultEmail;
      let resultStatusEmail;
      let resultStatusEmailSpv;

      if (!existingSurat) {
        // Buat email
        const dataEmail = {
          subject: submissionData.perihal_kontrak,
          from_department: submissionData.pemeriksa_barang.departemen_pemeriksa,
          to_company: submissionData.penyedia_barang.perusahaan_penyedia_barang,
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
    signaturePenyediaBarang,
    pemeriksaBarang,
    isSubmitting,

    // Setters
    setFormData,
    setMaterials,
    setSignaturePenyediaBarang,
    setPemeriksaBarang,
    // Methods
    handleSubmit,
  };
};
