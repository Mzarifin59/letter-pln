import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mapping role ke path yang dilarang
const restrictedPaths: Record<string, string[]> = {
  Admin: ["/create-letter-bongkaran"],
  Spv: [
    "/create-letter",
    "/create-letter/berita-pemeriksaan-tim-mutu",
    "/create-letter-bongkaran",
    "/draft",
    "/sent",
  ],
  "Gardu Induk": [
    "/create-letter",
    "/create-letter/berita-pemeriksaan-tim-mutu",
    "/create-letter-bongkaran",
    "/draft",
    "/sent",
  ],
  Vendor: [
    "/create-letter",
    "/create-letter/berita-pemeriksaan-tim-mutu",
  ],
};

// Helper function untuk fetch user role dari API
async function getUserRole(token: string): Promise<string | null> {
  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL tidak ditemukan");
      return null;
    }

    const res = await fetch(`${apiUrl}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const user = await res.json();
    return user?.role?.name || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  // path publik (bebas diakses tanpa login)
  const isPublicPath = ["/login", "/register"].some((path) =>
    pathname.startsWith(path)
  );

  // kalau belum login dan bukan halaman publik → redirect ke login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // kalau sudah login dan ke /login → redirect ke home
  if (isPublicPath && token && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // handle logout (hapus cookie dan arahkan ke login)
  if (pathname.startsWith("/logout")) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("token", "", { maxAge: 0, path: "/" });
    return res;
  }

  // Cek role-based access control
  if (token && !isPublicPath) {
    const userRole = await getUserRole(token);

    if (userRole && restrictedPaths[userRole]) {
      const forbiddenPaths = restrictedPaths[userRole];

      // Cek apakah pathname cocok dengan salah satu path yang dilarang
      // Urutkan dari yang paling spesifik ke yang paling umum
      const sortedPaths = forbiddenPaths.sort((a, b) => b.length - a.length);
      
      const isForbidden = sortedPaths.some((forbiddenPath) => {
        // Exact match atau pathname dimulai dengan forbiddenPath diikuti slash
        return (
          pathname === forbiddenPath || 
          pathname.startsWith(`${forbiddenPath}/`)
        );
      });

      if (isForbidden) {
        // Redirect ke home atau halaman yang diizinkan
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
}

// Hanya jalankan middleware di path tertentu (bukan static, API, dsb)
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|static|images|public).*)",
  ],
};
