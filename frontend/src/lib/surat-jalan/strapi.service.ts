import {
  API_CONFIG,
  API_CONFIG_EMAIL,
  API_CONFIG_STATUSEMAIL,
} from "@/lib/surat-jalan/form.constants";

interface StrapiResponse<T = any> {
  data: T;
  meta?: any;
}

export class StrapiAPIService {
  /**
   * Ambil token dari localStorage
   */
  private static getAuthToken(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("strapiToken") || "";
  }

  /**
   * Generate headers untuk request
   */
  private static getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.getAuthToken()}`,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  /**
   * Handle response dan error dari API
   */
  private static async handleResponse<T>(
    response: Response
  ): Promise<StrapiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Upload single file ke Strapi
   */
  static async uploadFile(file: File, customFilename?: string): Promise<any> {
    const formData = new FormData();

    // Jika ada custom filename, rename file
    const fileToUpload = customFilename
      ? new File([file], customFilename, { type: file.type })
      : file;

    formData.append("files", fileToUpload);

    console.groupCollapsed(`📤 Uploading file: ${fileToUpload.name}`);
    console.log("File info:", {
      name: fileToUpload.name,
      size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
      type: fileToUpload.type,
    });

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: formData,
      }
    );

    const data = await this.handleResponse(response);
    const uploadedFile = Array.isArray(data) ? data[0] : data;

    console.log("✅ Upload successful:", uploadedFile);
    console.groupEnd();

    return uploadedFile;
  }

  /**
   * Upload multiple files ke Strapi (versi debug)
   */
  static async uploadFiles(files: File[]): Promise<any[]> {
    console.groupCollapsed(`📤 Uploading ${files.length} file(s)`);
    console.table(
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    const uploadPromises = files.map((file) => this.uploadFile(file));
    const results = await Promise.all(uploadPromises);

    return results;
  }

  /**
   * Create Surat Jalan baru
   */
  static async createSuratJalan(data: any): Promise<StrapiResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suratJalan}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Update Surat Jalan
   */
  static async updateSuratJalan(
    documentId: string,
    data: any
  ): Promise<StrapiResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suratJalan}/${documentId}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Get Surat Jalan by ID
   */
  static async getSuratJalan(id: number): Promise<StrapiResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suratJalan}/${id}?populate=*`,
      {
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Delete Surat Jalan
   */
  static async deleteSuratJalan(id: number): Promise<void> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suratJalan}/${id}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      }
    );

    await this.handleResponse(response);
  }

  /**
   * Create Email baru
   */
  static async createEmail(data: any): Promise<StrapiResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG_EMAIL.endpoints.email}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Create Email baru
   */
  static async createStatusEmail(data: any): Promise<StrapiResponse> {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG_STATUSEMAIL.endpoints.statusEmail}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      }
    );

    return this.handleResponse(response);
  }
}
