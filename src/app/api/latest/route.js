"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-blue-400 mb-10">
          IoT Monitoring
        </h1>

        <nav className="flex flex-col gap-5 flex-1">
          <Link href="/dashboard" className="hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/perangkat" className="hover:text-blue-400">
            Perangkat
          </Link>
          <Link href="/histori" className="hover:text-blue-400">
            Histori
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="text-red-400 hover:opacity-80 mt-auto"
        >
          Keluar
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-100 p-10">
        {children}
      </main>

    </div>
  );
}