import FormCreatePemeriksaanPage from "./form-create";
import { SuratJalan } from "@/lib/interface";
import { getAllSuratJalan } from "@/lib/fetch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateLetterPemeriksaanPage() {
  const data : SuratJalan[] = await getAllSuratJalan();

  return <FormCreatePemeriksaanPage dataSurat={data}/>;
}