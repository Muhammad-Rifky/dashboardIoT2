import db from "../../../lib/db";
import { getUser } from "../../../lib/auth";

export async function POST(req){
    try{
        const user = await getUser();

        if(!user){
            return Response.json(
                { error:"Unauthorized" },
                { status:401 }
            );
        }

        const { id } = await req.json();

        if(!id){
            return Response.json(
                { error:"ID tidak ditemukan" },
                { status:400 }
            );
        }

        // 🔥 SUPERADMIN bisa hapus pengguna
        if(user.role === "superadmin"){
            await db.execute(
                "DELETE FROM users WHERE id=?",
                [id]
            );
        }

        return Response.json({ message:"User berhasil dihapus" });

    }catch(err){

            console.log(err);
            return Response.json(
                { error:"Server error" },
                { status:500 }
            );
        
    }
}