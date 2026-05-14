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

export default function AnalysisPage(){

  const [devices,setDevices] = useState([]);
  const [deviceA,setDeviceA] = useState("");
  const [deviceB,setDeviceB] = useState("");

  const [dataA,setDataA] = useState([]);
  const [dataB,setDataB] = useState([]);

  // LOAD DEVICES
  useEffect(()=>{
    fetch("/api/devices")
    .then(res=>res.json())
    .then(setDevices);
  },[]);

  // LOAD DATA
  useEffect(()=>{

    if(deviceA){
      fetch(`/api/sensor/history?device_id=${deviceA}`)
        .then(res=>res.json())
        .then(setDataA);
    } else setDataA([]);

    if(deviceB){
      fetch(`/api/sensor/history?device_id=${deviceB}`)
        .then(res=>res.json())
        .then(setDataB);
    } else setDataB([]);

  },[deviceA,deviceB]);

  const merged = dataA.map((d,i)=>({
    time: d.created_at,

    phA: d.ph,
    phB: dataB[i]?.ph || null,

    suhuA: d.suhu,
    suhuB: dataB[i]?.suhu || null,

    tdsA: d.tds,
    tdsB: dataB[i]?.tds || null,

    turbA: d.turbidity,
    turbB: dataB[i]?.turbidity || null
  }));

  const nameA = devices.find(d=>d.device_id===deviceA)?.name || "Device A";
  const nameB = devices.find(d=>d.device_id===deviceB)?.name || "Device B";

  return(
    <div>
        <div className="bg-white p-6 rounded shadow border-l-4 mb-6 border-gray-200">
            <h1 className="text-xl font-bold mb-4">
                Analysis Perbandingan
            </h1>
                {(!deviceA || !deviceB) && (
                    <p className="text-gray-400 mb-4">
                    Pilih device untuk dibandingkan
                    </p>
                )}

            {/* DROPDOWN */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">

                <select
                value={deviceA}
                onChange={(e)=>setDeviceA(e.target.value)}
                className=" p-2 rounded bg-white shadow border-gray-200 border-l-4"
                >
                <option value="">Device A</option>
                {devices.map(d=>(
                    <option key={d.device_id} value={d.device_id}>
                    {d.name}
                    </option>
                ))}
                </select>

                <select
                value={deviceB}
                onChange={(e)=>setDeviceB(e.target.value)}
                className=" p-2 rounded bg-white shadow border-gray-200 border-l-4"
                >
                <option value="">Device B</option>
                {devices.map(d=>(
                    <option key={d.device_id} value={d.device_id}>
                    {d.name}
                    </option>
                ))}
                </select>

            </div>
        </div>


      <CompareLine title="pH" data={merged} a="phA" b="phB" nameA={nameA} nameB={nameB}/>
      <CompareLine title="Suhu" data={merged} a="suhuA" b="suhuB" nameA={nameA} nameB={nameB}/>
      <CompareLine title="TDS" data={merged} a="tdsA" b="tdsB" nameA={nameA} nameB={nameB}/>
      <CompareLine title="Kekeruhan" data={merged} a="turbA" b="turbB" nameA={nameA} nameB={nameB}/>

    </div>
  );
}

/* COMPARE LINE */
function CompareLine({ title, data, a, b, nameA, nameB }){

  return(
    <div className="bg-white p-6 rounded shadow border-l-4 mb-6 border-gray-200">

      <h2 className="font-bold mb-4">{title}</h2>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis 
            dataKey="time"
            tickFormatter={(value) => {
                const date = new Date(value);
                const jam = String(date.getHours()).padStart(2, "0");
                const menit = String(date.getMinutes()).padStart(2, "0");
                return `${jam}.${menit}`;
            }}
            />
            <YAxis/>
          <Tooltip/>

          <Line dataKey={a} stroke="blue" name={nameA} dot={false}/>
          <Line dataKey={b} stroke="red" name={nameB} dot={false}/>

        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}