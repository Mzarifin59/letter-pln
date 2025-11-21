"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginContentPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      if (!loginRes.ok) {
        toast.error("Login gagal", {
          description: "Username atau password salah. Silakan coba lagi.",
          position: "top-center",
        });
        setIsLoading(false);
        return;
      }

      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        toast.error("Gagal mengambil data user", {
          description: "Terjadi kesalahan saat memuat informasi pengguna.",
          position: "top-center",
        });
        setIsLoading(false);
        return;
      }

      const user = await meRes.json();

      if (user.role?.name === "Admin") {
        toast.success("Login berhasil!", {
          description: "Selamat datang kembali, Admin.",
          position: "top-center",
        });

        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else if (user.role?.name === "Spv") {
        toast.success("Login berhasil!", {
          description: "Selamat datang kembali, Supervisor.",
          position: "top-center",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else if (user.role?.name === "Vendor") {
        toast.success("Login berhasil!", {
          description: "Selamat datang kembali, Vendor.",
          position: "top-center",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else if (user.role?.name === "Gardu Induk") {
        toast.success("Login berhasil!", {
          description: "Selamat datang kembali, Gardu Induk.",
          position: "top-center",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        toast.error("Kesalahan Login", {
          description: "Email dan password salah",
          position: "top-center",
        });
        setIsLoading(false);
      }
    } catch {
      toast.error("Terjadi kesalahan", {
        description: "Tidak dapat terhubung ke server. Coba lagi nanti.",
        position: "top-center",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-8">
          <Image
            src="/images/PLN-logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="w-[60px] h-[60px] object-contain"
          />
          <div className="flex flex-col">
            <h2 className="text-[#003367] text-lg font-extrabold leading-tight">
              SIGASPOL
            </h2>
            <p className="text-[#003367] text-[8px] leading-tight mt-1 w-3/4">
              Aplikasi Gudang Surat jalan dan Pengelolaan Bongkaran Logistik
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4263EB]"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4263EB]"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-md bg-[#4263EB] text-white font-semibold hover:bg-[#3650c7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
