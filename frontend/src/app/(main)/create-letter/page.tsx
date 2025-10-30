import FormCreatePage from "./form-create";
import { SuratJalan } from "@/lib/interface";
import { getAllSuratJalan } from "@/lib/fetch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateLetterPage() {
  const data : SuratJalan[] = await getAllSuratJalan();

  return <FormCreatePage dataSurat={data}/>;
}