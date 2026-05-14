"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import { io } from "socket.io-client";

export const dynamic = "force-dynamic";

export default function DashboardPage() {

  const [data,setData] = useState(null);
  const [devices,setDevices] = useState([]);
  const [selectedDevice,setSelectedDevice] = useState("");

  // 🔥 LOAD DEVICE LIST
  useEffect(()=>{
    fetch("/api/devices")
    .then(res=>res.json())
    .then(res=>{
      setDevices(res);
      if(res.length > 0){
        setSelectedDevice(res[0].device_id);
      }
    });
  },[]);

  // 🔥 LOAD DATA BERDASARKAN DEVICE
  useEffect(()=>{

    if(!selectedDevice) return;

    let socket;

    fetch(`/api/sensor/dashboard?device_id=${selectedDevice}`)
    .then(res=>{
      if(res.status === 401){
        window.location.href="/login"; // 🔥 PROTEKSI SESSION
        return null;
      }
      return res.json();
    })
    .then(res=>{
      if(res) setData(res);
    });

    socket = io("http://localhost:3001",{
      reconnection:false
    });  //kalau sudah deploy ganti

    socket.on("sensor_update",(newData)=>{

      if(newData.device_id !== selectedDevice) return;

      setData(prev=>{
        if(!prev || !prev.history) return prev;

        let updatedHistory = [...prev.history, newData];

        // 🔥 LIMIT 14 DATA
        if(updatedHistory.length > 14){
          updatedHistory = updatedHistory.slice(-14);
        }

        // 🔥 HITUNG ULANG RATA-RATA
        const avgPH = updatedHistory.reduce((a,b)=>a+Number(b.ph),0)/updatedHistory.length;
        const avgSuhu = updatedHistory.reduce((a,b)=>a+Number(b.suhu),0)/updatedHistory.length;
        const avgTDS = updatedHistory.reduce((a,b)=>a+Number(b.tds),0)/updatedHistory.length;
        const avgTurbidity = updatedHistory.reduce((a,b)=>a+Number(b.turbidity),0)/updatedHistory.length;

        return {
          history: updatedHistory,
          average:{
            ph: avgPH.toFixed(2),
            suhu: avgSuhu.toFixed(2),
            tds: avgTDS.toFixed(0),
            turbidity: avgTurbidity.toFixed(2)
          }
        };
      });

    });

    return ()=>{
      if(socket) socket.disconnect();
    };

  },[selectedDevice]);

  // 🔥 SAFE RENDER
  if(!data || !data.average || !data.history){
    return <p>Loading...</p>;
  }

  return(
    <div>
      {/* 🔥 JUDUL */}
      <h1 className="text-2xl font-bold text-black mb-2">
        Data Kualitas Air {devices.find(d=>d.device_id===selectedDevice)?.name || "-"}
      </h1>

      <p className="text-gray-500 mb-6">
        Dalam 7 Hari Terakhir
      </p>
      {/* 🔥 DROPDOWN DEVICE */}
      <div className="mb-6">
        <select
          value={selectedDevice}
          onChange={(e)=>setSelectedDevice(e.target.value)}
          className=" p-2 rounded bg-white shadow border-gray-200 border-l-4"
        >
          {devices.map(d=>(
            <option key={d.id} value={d.device_id}>
              {d.name} ({d.device_id})
            </option>
          ))}
        </select>
      </div>

      {/* ===== NILAI RATA RATA ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">

        <Card title="pH Rata-rata" value={data.average?.ph} unit="" type="ph" />

        <Card title="Suhu Rata-rata" value={data.average?.suhu} unit="°C" type="suhu" />

        <Card title="TDS Rata-rata" value={data.average?.tds} unit="ppm" type="tds" />

        <Card title="Kekeruhan Rata-rata" value={data.average?.turbidity} unit="NTU" type="turbidity" />
      </div>

      {/* ===== GRAFIK ===== */}
      <div className="grid grid-cols-1 gap-10">

        <Chart title="Grafik pH" data={data.history} dataKey="ph" />
        <Chart title="Grafik Suhu" data={data.history} dataKey="suhu" />
        <Chart title="Grafik TDS" data={data.history} dataKey="tds" />
        <Chart title="Grafik Kekeruhan" data={data.history} dataKey="turbidity" />

      </div>

    </div>
  );
}

function Card({ title, value, unit, type }) {

  const getStatus = (latestValue, type) => {
    const val = parseFloat(
      String(latestValue)
        .replace(",", ".")
        .replace(/[^0-9.-]/g, "")
    );

    const t = String(type).toLowerCase();

    console.log("TYPE:", t, "VALUE:", latestValue, "PARSED:", val);

    if (isNaN(val)) return "normal";

    switch (t) {
      case "ph":
        if (val < 6 || val > 8.5) return "danger";
        if (val < 6.5 || val > 8) return "warning";
        return "normal";

      case "suhu":
        if (val < 24 || val > 32) return "danger";
        if (val < 26 || val > 30) return "warning";
        return "normal";

      case "tds":
        if (val > 1000) return "danger";
        if (val > 800) return "warning";
        return "normal";

      case "turbidity":
        if (val > 2000) return "danger";
        if (val > 1000) return "warning";
        return "normal";

      default:
        return "normal";
    }
  };

  // 🔥 FIX: kirim parameter dengan benar
  const status = getStatus(value, type);

  const colorMap = {
    normal: "text-blue-500",
    warning: "text-yellow-500",
    danger: "text-red-500 animate-pulse"
  };

  const borderMap = {
    normal: "border-gray-200",
    warning: "border-yellow-400",
    danger: "border-red-500"
  };

  return (
    <div className={`bg-white p-6 rounded shadow border-l-4 ${borderMap[status]}`}>

      <h2 className="text-gray-900 mb-2">{title}</h2>

      <p className={`text-3xl font-bold ${colorMap[status]}`}>
        {value ?? "-"} {unit}
      </p>

      <p className="text-xs mt-2 text-gray-400 capitalize">
        {status === "normal" && "Normal"}
        {status === "warning" && "Perlu perhatian"}
        {status === "danger" && "Bahaya ⚠️"}
      </p>

    </div>
  );
}

function Chart({title,data,dataKey}){

  // 🔥 FILTER 7 HARI TERAKHIR + SORT
  const getFilteredData = () => {
    if(!data) return [];

    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 7);

    return [...data]
      .filter(item => {
        const d = new Date(item.created_at);
        return d >= last7Days && d <= now;
      })
      .sort((a,b)=> new Date(a.created_at) - new Date(b.created_at)); // 🔥 biar kiri lama, kanan terbaru
  };

  const chartData = getFilteredData();

  // 🔥 FORMAT JAM (XAxis)
  const formatTime = (time)=>{
    const date = new Date(time);
    return date.toLocaleTimeString("id-ID",{
      hour:"2-digit",
      minute:"2-digit"
    });
  };

  //  TOOLTIP DETAIL (tanggal + jam + value)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);

      return (
        <div style={{ background:"#fff", padding:10, border:"1px solid #ccc" }}>
          <p>
            {date.toLocaleDateString("id-ID",{
              day:"numeric",
              month:"long",
              year:"numeric"
            })}
          </p>
          <p>
            {date.toLocaleTimeString("id-ID",{
              hour:"2-digit",
              minute:"2-digit"
            })}
          </p>
          <p>{dataKey}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };
 
  return(
    <div className="bg-white p-6 rounded shadow border-l-4 border-gray-200">

      <h2 className="font-bold mb-4">{title}</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="created_at" 
            tickFormatter={formatTime}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            strokeWidth={2} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}