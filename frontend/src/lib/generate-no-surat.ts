import { SuratJalan } from "@/lib/interface";

// Konversi angka bulan (1-12) ke angka romawi
export function toRomanMonth(month: number): string {
  const romanNumerals: { [key: number]: string } = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  };
  return romanNumerals[month] || "I";
}


// Generate nomor surat jalan berikutnya berdasarkan data yang ada
// Format: NO : XXX.SJ/GD.UPT-BDG/BULAN_ROMAWI/TAHUN
export function generateNextSuratNumber(existingData: SuratJalan[]): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; 
  const currentYear = now.getFullYear();
  const romanMonth = toRomanMonth(currentMonth);

  let maxNumber = 0;
  
  existingData.forEach((surat) => {
    const noSurat = surat.no_surat_jalan || "";
    
    const patterns = [
      /NO\s*:\s*(\d+)\./i,
      /NO:\s*(\d+)\./i,
      /^(\d+)\./,
      /(\d+)\.SJ/i
    ];
    
    for (const pattern of patterns) {
      const match = noSurat.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
          console.log(`  📊 New max found: ${noSurat} -> ${num}`);
        }
        break;
      }
    }
  });

  console.log('- Nomor tertinggi dari semua surat:', maxNumber);

  // Nomor berikutnya
  const nextNumber = maxNumber + 1;
  
  // Format dengan leading zeros (3 digit)
  const formattedNumber = String(nextNumber).padStart(3, "0");

  // Generate nomor surat lengkap dengan bulan/tahun SAAT INI
  const generatedNumber = `NO : ${formattedNumber}.SJ/GD.UPT-BDG/${romanMonth}/${currentYear}`;
  
  console.log('✅ Nomor surat ter-generate:', generatedNumber);

  return generatedNumber;
}


// Validasi format nomor surat jalan
export function validateSuratNumber(nomorSurat: string): boolean {
  const pattern = /^NO\s*:\s*\d{3}\.SJ\/GD\.UPT-BDG\/[IVX]+\/\d{4}$/i;
  return pattern.test(nomorSurat);
}


// Parse informasi dari nomor surat jalan
export function parseSuratNumber(nomorSurat: string): {
  sequence: number;
  month: string;
  year: number;
} | null {
  const match = nomorSurat.match(/NO\s*:\s*(\d+)\.SJ\/GD\.UPT-BDG\/([IVX]+)\/(\d{4})/i);
  
  if (!match) return null;

  return {
    sequence: parseInt(match[1], 10),
    month: match[2],
    year: parseInt(match[3], 10),
  };
}