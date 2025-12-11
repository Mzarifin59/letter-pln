import qs from "qs";
import { cookies } from "next/headers";

if (!process.env.API_URL) {
  throw new Error("API_URL environment variable is not defined");
}

export const apiUrl = process.env.API_URL;

interface FetchOptions {
  cache?: RequestCache;
  next?: {
    tags?: string[];
  };
}

async function fetchWithError(url: string, options: FetchOptions = {}) {
  // const cookieStore = await cookies();
  // const token = cookieStore.get("token")?.value;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getAllSuratJalan() {
  try {
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
        penyedia_barang: {
          fields: ["perusahaan_penyedia_barang", "nama_penanggung_jawab"],
          populate: {
            ttd_penerima: {
              fields: ["name", "url"],
            },
          },
        },
        pemeriksa_barang: {
          fields: ["departemen_pemeriksa"],
          populate: {
            mengetahui: {
              fields: ["departemen_mengetahui", "nama_mengetahui"],
              populate: {
                ttd_mengetahui: {
                  fields: ["name", "url"],
                },
              },
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
        cop_surat: {
          fields: ["name", "url"],
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

    const data = await fetchWithError(`${apiUrl}/api/surat-jalans?${query}`, {
      next: {
        tags: ["surat-jalan"],
      },
    });

    return data.data;
  } catch (error) {
    console.error("Error fetching Data Surat Jalan:", error);
    throw error;
  }
}

export async function getAllEmails() {
  try {
    const query = qs.stringify({
      sort: ["createdAt:asc"],
      populate: {
        surat_jalan: {
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
            penyedia_barang: {
              fields: ["perusahaan_penyedia_barang", "nama_penanggung_jawab"],
              populate: {
                ttd_penerima: {
                  fields: ["name", "url"],
                },
              },
            },
            pemeriksa_barang: {
              fields: ["departemen_pemeriksa"],
              populate: {
                mengetahui: {
                  fields: ["departemen_mengetahui", "nama_mengetahui"],
                  populate: {
                    ttd_mengetahui: {
                      fields: ["name", "url"],
                    },
                  },
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
            cop_surat: {
              fields: ["name", "url"],
            },
          },
        },
        sender: {
          fields: ["name", "email"],
        },
        recipient: {
          fields: ["name", "email"],
        },
        email_statuses: {
          fields: [
            "is_read",
            "is_bookmarked",
            "read_at",
            "bookmarked_at",
            "isDelete",
          ],
          populate: {
            user: {
              fields: ["name", "email"],
            },
          },
        },
        attachment_files: {
          fields: ["name", "url"],
        },
      },
    });

    const data = await fetchWithError(`${apiUrl}/api/emails?${query}`, {
      next: {
        tags: ["email"],
      },
    });

    return data.data;
  } catch (error) {
    console.error("Error fetching Data Email Gue:", error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const data = await fetchWithError(`${apiUrl}/api/users?populate=role`, {
      next: {
        tags: ["users"],
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching Data User:", error);
    throw error;
  }
}
