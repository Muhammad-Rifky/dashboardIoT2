"use client";

import { useEffect,useState } from "react";

export const dynamic = "force-dynamic";

export default function DevicesPage(){

  const [devices,setDevices] = useState([]);
  const [currentPage,setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [deviceId,setDeviceId] = useState("");
  const [name,setName] = useState("");
  const [location,setLocation] = useState("");

  const [user,setUser] = useState(null);
  const [users,setUsers] = useState([]);
  const [selectedUser,setSelectedUser] = useState("");

  const [selectedName,setSelectedName] = useState("");
  const [error,setError] = useState("");

  const [showConfirm,setShowConfirm] = useState(false);
  const [selectedId,setSelectedId] = useState(null);

  function loadDevices(){
    fetch("/api/devices", { cache: "no-store" }) // 🔥 anti cache
    .then(res=>res.json())
    .then(res=>setDevices(res));
  }

  useEffect(()=>{
    fetch("/api/me")
    .then(res=>res.json())
    .then(data=>setUser(data));
  },[]);

  useEffect(()=>{
    if(user?.role === "superadmin"){
      fetch("/api/users")
        .then(res=>res.json())
        .then(data=>setUsers(data));
    }
  },[user]);

  useEffect(()=>{
    loadDevices();

    // 🔥 polling tiap 5 detik
    const interval = setInterval(() => {
      loadDevices();
    }, 5000);

    return () => clearInterval(interval);
  },[]);

  // 🔥 RESET PAGE kalau data berubah
  useEffect(()=>{
    setCurrentPage(1);
  },[devices]);

  async function addDevice(){

    if(!deviceId || !name || !location){
      setError("Semua field wajib diisi!");
      return;
    }

    setError("");

    const res = await fetch("/api/devices/add",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        device_id:deviceId,
        name:name,
        location:location,
        user_id:selectedUser
      })
    });

    const data = await res.json();

    if(!res.ok){
      setError(data.error || "Gagal menambahkan device");
      return;
    }

    setDeviceId("");
    setName("");
    setLocation("");
    setSelectedUser("");

    loadDevices();
  }

  async function handleDelete(){

    const res = await fetch("/api/devices/delete",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ id:selectedId })
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.error || "Gagal hapus device");
      return;
    }

    setShowConfirm(false);
    setSelectedId(null);

    loadDevices();
  }

  if(!user) return <div className="p-6">Loading...</div>;

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentDevices = devices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(devices.length / rowsPerPage);
  return(

    <div className="bg-white p-6 rounded shadow border-l-4 border-gray-200  sm:p-6">

      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manajemen Perangkat
      </h1>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow border mb-8">

        <h2 className="font-semibold mb-4 text-gray-700">
          Tambah Device
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <input
            placeholder="Device ID"
            value={deviceId}
            onChange={e=>setDeviceId(e.target.value)}
            className="border p-3 rounded w-full"
          />

          <input
            placeholder="Name"
            value={name}
            onChange={e=>setName(e.target.value)}
            className="border p-3 rounded w-full"
          />

          <input
            placeholder="Location"
            value={location}
            onChange={e=>setLocation(e.target.value)}
            className="border p-3 rounded w-full"
          />

          {user.role === "superadmin" && (
            <select
              value={selectedUser}
              onChange={e=>setSelectedUser(e.target.value)}
              className="border p-3 rounded w-full"
            >
              <option value="">Pilih User</option>
              {users.map(u=>(
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}

        </div>
        <button
          onClick={addDevice}
          className="mt-4 w-full sm:w-auto bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 cursor-pointer"
        >
          Tambah
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
        {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Device ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-left">Last Seen</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {currentDevices.map((d,i)=>(
              <tr key={d.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{indexOfFirst + i + 1}</td>
                <td className="p-3">{d.device_id}</td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.location}</td>
                <td className="p-3 text-center">
                  {d.status === "online" ? "🟢 Online" : "🔴 offline"}
                </td>
                <td className="p-3">
                  {d.last_seen
                    ? new Date(d.last_seen).toLocaleString("id-ID")
                    : "-"}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={()=>{
                      setSelectedId(d.id);
                      setSelectedName(d.name);
                      setShowConfirm(true);
                    }}
                    className="mt-3 w-full bg-white text-red-500 hover:bg-red-500 px-4 py-2 shadow rounded hover:text-white cursor-pointer"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {currentDevices.map((d,i)=>(
          <div key={d.id} className="border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">#{indexOfFirst + i + 1}</p>

            <p className="font-semibold">{d.name}</p>
            <p className="text-sm text-gray-600">{d.device_id}</p>

            <div className="mt-2 text-sm">
              <p><b>Lokasi:</b> {d.location}</p>
              <p><b>Status:</b> {d.status === "online" ? "🟢 Online" : "🔴 Offline"}</p>
              <p>
                <b>Last Seen:</b>{" "}
                {d.last_seen
                  ? new Date(d.last_seen).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>

            <button
              onClick={()=>{
                setSelectedId(d.id);
                setSelectedName(d.name);
                setShowConfirm(true);
              }}
              className="mt-3 w-full bg-white text-red-500 hover:bg-red-500 px-4 py-2 shadow rounded hover:text-white cursor-pointer"
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
                className="bg-gray-400 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-500"
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