import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

// Hanya jalankan middleware di path tertentu (bukan static, API, dsb)
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|static|images|public).*)",
  ],
};
