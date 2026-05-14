"use client";

import { useEffect,useState } from "react";

export const dynamic = "force-dynamic";

export default function HistoriPage(){

  const [data,setData] = useState([]);
  const [filteredData,setFilteredData] = useState([]);
  const [devices,setDevices] = useState([]);

  const [selectedDevice,setSelectedDevice] = useState("");
  const [startDate,setStartDate] = useState("");
  const [endDate,setEndDate] = useState("");

  const [currentPage,setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // 🔥 LOAD DATA
  useEffect(()=>{
    fetch("/api/sensor/history")
    .then(res=>res.json())
    .then(res=>{
      setData(res);
      setFilteredData(res); // 🔥 jangan di slice
    });

    fetch("/api/devices")
    .then(res=>res.json())
    .then(res=>{
      setDevices(res);
    });

  },[]);

  // 🔥 FILTER
  useEffect(()=>{

    setCurrentPage(1);

    let filtered = [...data];

    if(selectedDevice){
      filtered = filtered.filter(d=>d.device_id === selectedDevice);
    }

    if(startDate && endDate){
      filtered = filtered.filter(d=>{
        const t = new Date(d.created_at);
        return t >= new Date(startDate) && t <= new Date(endDate);
      });
    }

    setFilteredData(filtered);

  },[selectedDevice,startDate,endDate,data]);

  // 🔥 PAGINATION
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 🔥 EXPORT CSV
  const exportCSV = async () => {

    if(!startDate || !endDate){
      alert("Pilih range tanggal dulu!");
      return;
    }

    const query = new URLSearchParams({
      device_id: selectedDevice || "",
      start: startDate,
      end: endDate
    });

    const res = await fetch(`/api/sensor/export?${query}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-${selectedDevice || "all"}-${startDate}-${endDate}.xlsx`;
    a.click();
  };

  const maxVisiblePages = 10;

  let startPage = currentPage;
  let endPage = currentPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return(

    <div className="bg-white p-6 rounded shadow border-l-4 border-gray-200  sm:p-6">

      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Riwayat Data
      </h1>

      <p className="text-gray-500 mb-6">
        Filter dan export data sensor
      </p>

      {/* FILTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        <select
          value={selectedDevice}
          onChange={(e)=>setSelectedDevice(e.target.value)}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Semua Device</option>
          {devices.map(d=>(
            <option key={d.id} value={d.device_id}>
              {d.name} ({d.device_id})
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e)=>setStartDate(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e)=>setEndDate(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={exportCSV}
          disabled={filteredData.length === 0}
          className={`px-4 py-2 rounded text-white transition ${
            filteredData.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-900 hover:bg-gray-700"
          } cursor-pointer`}
        >
          Download CSV
        </button>

      </div>

      {/* MOBILE */}
      <div className="sm:hidden space-y-3">

        {currentData.length === 0 ? (
          <p className="text-center text-gray-500">Data tidak tersedia</p>
        ) : (
          currentData.map((d,i)=>(
            <div key={i} className="border rounded-lg p-4 shadow-sm">

              <div className="flex justify-between mb-2">
                <span className="font-semibold">{d.device_id}</span>
                <span className="text-xs text-gray-500">
                  {new Date(d.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>pH: <b>{Number(d.ph).toFixed(2)}</b></p>
                <p>Suhu: <b>{Number(d.suhu).toFixed(2)}°C</b></p>
                <p>TDS: <b>{d.tds}</b></p>
                <p>NTU: <b>{d.turbidity}</b></p>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                {new Date(d.created_at).toLocaleTimeString("id-ID")}
              </p>

            </div>
          ))
        )}

      </div>

      {/* DESKTOP */}
      <div className="hidden sm:block overflow-auto  rounded-lg">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Device</th>
              <th className="p-3 text-left">pH</th>
              <th className="p-3 text-left">Suhu</th>
              <th className="p-3 text-left">TDS</th>
              <th className="p-3 text-left">NTU</th>
              <th className="p-3 text-left w-1/4">Waktu</th>
            </tr>
          </thead>

          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-gray-400">
                  📭 Tidak ada data
                </td>
              </tr>
            ) : (
            currentData.map((d,i)=>(
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3">{indexOfFirst + i + 1}</td>
                <td className="p-3">{d.device_id}</td>
                <td className="p-3">{Number(d.ph).toFixed(2)}</td>
                <td className="p-3">{Number(d.suhu).toFixed(2)}°C</td>
                <td className="p-3">{d.tds}</td>
                <td className="p-3">{d.turbidity}</td>
                <td className="p-3">
                  {new Date(d.created_at).toLocaleString("id-ID")}
                </td>

              </tr>
            ))
            )}
          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">

        <button
          onClick={()=>setCurrentPage(prev=>Math.max(prev-1,1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        ).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-gray-900 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={()=>setCurrentPage(prev=>Math.min(prev+1,totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}