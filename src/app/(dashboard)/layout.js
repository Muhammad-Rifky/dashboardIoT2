"use client";
import { useState, useEffect } from "react";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Cpu,
  History,
  Users,
  ChevronDown
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {

  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [user,setUser] = useState(null);

  const [openDashboard,setOpenDashboard] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(()=>{
    fetch("/api/me")
    .then(res=>res.json())
    .then(setUser);
  },[]);

  const logout = async () => {
    await fetch("/api/logout",{ method:"POST" });
    window.location.href = "/login";
  };

  if(!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className={`
        fixed z-40 top-0 left-0 h-full w-64 bg-gray-900 text-white
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static
      `}>

        {/* WRAPPER SCROLL */}
        <div className="flex flex-col h-full overflow-y-auto">

          {/* LOGO */}
          <div className="p-6 border-b border-gray-700 flex items-center gap-3 flex-shrink-0">
            <div className="bg-white text-gray-900 px-2 py-1 rounded font-bold">
              💧
            </div>
            <h1 className="text-lg font-bold">
              AquaFarm Monitor©
            </h1>
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-1 p-4 flex-1">

            {/* DASHBOARD */}
            <div>
              <button
                onClick={()=>setOpenDashboard(!openDashboard)}
                className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18}/>
                  Dashboard
                </div>
                <ChevronDown
                  size={16}
                  className={`transition ${openDashboard ? "rotate-180" : ""}`}
                />
              </button>

              {openDashboard && (
                <div className="ml-6 mt-1 flex flex-col gap-1">

                  <button
                    onClick={()=>router.push("/dashboard")}
                    className={`text-left px-3 py-2 rounded cursor-pointer ${
                      pathname === "/dashboard"
                        ? "bg-gray-700"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    Data Grafik
                  </button>

                  <button
                    onClick={()=>router.push("/dashboard/analysis")}
                    className={`text-left px-3 py-2 rounded cursor-pointer ${
                      pathname === "/dashboard/analysis"
                        ? "bg-gray-700"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    Analysis
                  </button>

                </div>
              )}
            </div>

            {/* DEVICES */}
            <button
              onClick={()=>router.push("/devices")}
              className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer ${
                pathname.startsWith("/devices")
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              <Cpu size={18}/>
              Devices
            </button>

            {/* HISTORY */}
            <button
              onClick={()=>router.push("/history")}
              className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer ${
                pathname.startsWith("/history")
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              <History size={18}/>
              History
            </button>

            {/* USERS */}
            {user.role === "superadmin" && (
              <button
                onClick={()=>router.push("/user")}
                className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer ${
                  pathname.startsWith("/user")
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
              >
                <Users size={18}/>
                Users
              </button>
            )}

          </nav>

          {/* USER INFO */}
          <div className="px-4 mt-4 text-sm text-gray-400 flex-shrink-0">
            <p>Login sebagai:</p>
            <p className="text-white font-semibold">{user.name}</p>
            <p className="text-xs">({user.role})</p>
          </div>

          {/* LOGOUT */}
          <div className="p-4 flex-shrink-0">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 w-full cursor-pointer"
            >
              <LogOut size={18}/>
              Logout
            </button>
          </div>

        </div>

      </aside>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={()=>setSidebarOpen(false)}
        />
      )}

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        <header className="bg-white shadow p-4 flex items-center">
          <button
            className="md:hidden mr-4 cursor-pointer"
            onClick={()=>setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24}/>
          </button>

          <h1 className="font-semibold">
            Monitoring Sistem Kolam
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  );
}