export async function loginToStrapi(identifier: string, password: string) {
  const res = await fetch(`${process.env.API_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    throw new Error("Login gagal, periksa email/password.");
  }

  return res.json(); // { jwt, user }
}
