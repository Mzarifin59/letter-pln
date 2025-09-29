import qs from "qs";

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
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetcher(url: string, options: FetchOptions = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

export async function getAllSuratJalan(status: string) {
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
        lampiran: {
          fields: ["name", "url"],
        },
        emails: {
          fields: ["subject", "from_department", "to_company", "pesan"],
          populate: {
            sender: {
              fields: ["name", "email"],
            },
            recipients: {
              fields: ["name", "email"],
            },
            attachment_files: true,
          },
        },
      },
      status: status,
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

export async function getAllEmails(status: string) {
  try {
    const query = qs.stringify({
      sort: ["createdAt:desc"],
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
            lampiran: {
              fields: ["name", "url"],
            },
            emails: {
              fields: ["subject", "from_department", "to_company", "pesan"],
            },
          },
        },
        sender: {
          fields: ["name", "email"],
        },
        recipients: {
          fields: ["name", "email"],
        },
        attachment_files: {
          fields: ["name", "url"],
        },
      },
      status: status,
    });

    const data = await fetchWithError(`${apiUrl}/api/emails?${query}`, {
      next: {
        tags: ["emial"],
      },
    });

    return data.data;
  } catch (error) {
    console.error("Error fetching Data Email:", error);
    throw error;
  }
}
