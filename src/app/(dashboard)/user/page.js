"use client";

import { useEffect, useState } from "react";
export const dynamic = "force-dynamic";

export default function UsersPage(){

  const [users,setUsers] = useState([]);
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [currentPage,setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [error,setError] = useState("");
  const [showConfirm,setShowConfirm] = useState(false);
  const [selectedId,setSelectedId] = useState(null);
  const [selectedName,setSelectedName] = useState("");

  async function loadUsers(){
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  }

  useEffect(()=>{
    loadUsers();
  },[]);

  async function addUser(){

    if(!name || !email || !password){
      setError("Semua field wajib diisi!");
      return;
    }

    setError("");

    const res = await fetch("/api/users/add",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        name: name,
        email: email,
        password: password,
        role:"petani"
      })
    });

    const data = await res.json();

    if(!res.ok){
      setError(data.error || "Gagal menambahkan user");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");

    loadUsers();
  }

  async function handleDelete() {
    const res = await fetch("/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal menghapus user");
      return;
    }
    setSelectedId(null);
    setShowConfirm(false);
    loadUsers();
    
  }

   // 🔥 PAGINATION LOGIC
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentUser = users.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  const maxVisiblePages = 10;

    let startPage = currentPage;
    let endPage = currentPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

  return(
    <div className="bg-white p-6 rounded shadow border-l-4 border-gray-200  sm:p-6">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manajemen User</h2>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow border mb-8">

        <h2 className="font-semibold mb-4 text-gray-700">
          Tambah Pengguna
        </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <input
          placeholder="Nama"
          value={name}
          onChange={e=>setName(e.target.value)}
          className="border p-3 rounded w-full"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="border p-3 rounded w-full"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          className="border p-3 rounded w-full"
        />

        <button
        onClick={addUser}
        className="mt-4 w-full sm:w-auto bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer"
        >
        Tambah
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

      </div>

      {/* DESKTOP */}
        <div className="hidden sm:block overflow-auto rounded-lg">
        <table className="w-full text-sm">
            <thead className="bg-gray-100">
            <tr>
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-center">Role</th>
                <th className="p-3 text-center">Aksi</th>
            </tr>
            </thead>

            <tbody>
            {currentUser.map((u,i)=>(
                <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{i+1}</td>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 break-all">{u.email}</td>
                <td className="p-3 text-center">{u.role}</td>
                <td className="p-3 text-center">
                    <button
                    onClick={()=>{
                        setSelectedId(u.id);
                        setSelectedName(u.name);
                        setShowConfirm(true);
                    }}
                    className="mt-3 w-full bg-white text-red-500 hover:bg-red-500 px-4 py-2 shadow rounded hover:text-white cursor-pointer border border-red-500"
                    >
                    Hapus
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
        {/* MOBILE */}
        <div className="md:hidden space-y-4 ">
            {currentUser.map((u,i)=>(
                <div key={u.id} className="border rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">#{i+1}</p>

                <p className="font-semibold">{u.name}</p>
                <p className="text-sm break-all text-gray-600">{u.email}</p>

                <p className="mt-2 text-sm">
                    <b>Role:</b> {u.role}
                </p>

                <button
                    onClick={()=>{
                    setSelectedId(u.id);
                    setSelectedName(u.name);
                    setShowConfirm(true);
                    }}
                    className="mt-3 w-full bg-white text-red-500 hover:bg-red-500 px-4 py-2 shadow rounded hover:text-white cursor-pointer border border-red-500"
                >
                    Hapus
                </button>
                </div>
            ))}
        </div>
        {/* 🔥 PAGINATION */}
      <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">

        <button
          onClick={()=>setCurrentPage(prev=>Math.max(prev-1,1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_,i)=>(
          <button
            key={i}
            onClick={()=>setCurrentPage(i+1)}
            className={`px-3 py-1 rounded ${
              currentPage === i+1
                ? "bg-gray-900 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            {i+1}
          </button>
        ))}

        <button
          onClick={()=>setCurrentPage(prev=>Math.min(prev+1,totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Next
        </button>

      </div>
      {/* 🔥 MODAL */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999"
          onClick={()=>setShowConfirm(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow w-[90%] max-w-sm text-center"
            onClick={(e)=>e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">
              Hapus Device
            </h2>

            <p className="mb-6">
              Yakin hapus <b>{selectedName}</b>?
            </p>

            <div className="flex justify-center gap-3">

              <button
                onClick={()=>setShowConfirm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded
                hover:bg-gray-500 cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-600"
              >
                Hapus
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
    
  );
}