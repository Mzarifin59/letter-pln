import FormCreatePage from "./form-create";
import { BeritaBongkaran } from "@/lib/interface";
import { getAllSuratJalan } from "@/lib/fetch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateLetterPage() {
  const data : BeritaBongkaran[] = await getAllSuratJalan();

  return <FormCreatePage dataSurat={data}/>;
}