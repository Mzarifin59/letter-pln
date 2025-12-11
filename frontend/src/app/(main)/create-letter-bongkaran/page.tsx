import FormCreatePage from "./form-create";
import { BeritaBongkaran, User } from "@/lib/interface";
import { getAllSuratJalan, getAllUsers } from "@/lib/fetch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateLetterPage() {
  const data : BeritaBongkaran[] = await getAllSuratJalan();
  const users: User[] = await getAllUsers();
  console.log("Users",users);

  return <FormCreatePage dataSurat={data} users={users} />;
}