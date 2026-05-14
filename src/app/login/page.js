"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);
  const [notif,setNotif] = useState(null);

  const router = useRouter();

  const handleLogin = async () => {

    setLoading(true);
    setNotif(null);

    const res = await fetch("http://76.13.192.195/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({email,password})
    });

    const data = await res.json();

    setLoading(false);

    if(res.ok){

      setNotif({
        type:"success",
        message:"Login berhasil..."
      });

      setTimeout(()=>{
        router.push("/dashboard");
      },1000);

    }else{

      setNotif({
        type:"error",
        message:data.error || "Login gagal"
      });

    }

  };

  return(

    <div className="flex h-screen bg-gray-100">

      {/* LEFT IMAGE */}

      <div className="hidden md:flex w-1/2 relative">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          className="object-cover w-full h-full"
        />

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">

          <div className="text-center max-w-md">

            <h1 className="text-4xl font-bold mb-4">
              IoT Monitoring
            </h1>

            <p>
              Monitoring kualitas air kolam secara realtime
              menggunakan sensor IoT.
            </p>

          </div>

        </div>

      </div>

      {/* LOGIN FORM */}

      <div className="flex flex-1 items-center justify-center">

        <div className="bg-white p-8 rounded-xl shadow-lg w-96">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Login Dashboard
          </h2>

          {notif && (

            <div className={`p-3 rounded mb-4 text-sm
              ${notif.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"}`}>

              {notif.message}

            </div>

          )}

          {/* EMAIL */}

          <div className="relative mb-4">

            <Mail
              className="absolute left-3 top-3 text-black"
              size={20}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full border rounded-xl p-3 pl-10
              focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

          </div>

          {/* PASSWORD */}

          <div className="relative mb-6">

            <Lock
              className="absolute left-3 top-3 text-black"
              size={20}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 pl-10 pr-10
              focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-black"
            >

              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}

            </button>

          </div>

          {/* BUTTON */}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-600 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed
            text-white p-3 rounded-xl transition"
          >

            {loading ? "Logging in..." : "Login"}

          </button>

        </div>

      </div>

    </div>

  );

}