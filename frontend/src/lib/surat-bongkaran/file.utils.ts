import { FILE_VALIDATION } from "@/lib/surat-bongkaran/form.constants";

export class FileUtils {
  /**
   * Validasi file berdasarkan tipe dan ukuran
   */
  static validate(file: File): { valid: boolean; error?: string } {
    if (!FILE_VALIDATION.validTypes.includes(file.type)) {
      return {
        valid: false,
        error: FILE_VALIDATION.errorMessages.invalidType,
      };
    }

    if (file.size > FILE_VALIDATION.maxSize) {
      return {
        valid: false,
        error: FILE_VALIDATION.errorMessages.tooLarge,
      };
    }

    return { valid: true };
  }

  /**
   * Convert file ke Base64 string
   */
  static toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert Data URL ke Blob
   */
  static async dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Convert Data URL ke File
   */
  static async dataURLToFile(
    dataURL: string,
    filename: string
  ): Promise<File> {
    const blob = await this.dataURLToBlob(dataURL);
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Format file size ke format yang mudah dibaca
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}