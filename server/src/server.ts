import dotenv from "dotenv";
import app from "./app"

import {pool} from "./config/database.js";
const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try{
        const conn = await pool.getConnection();
        console.log("Mysql connected successfully.");
        conn.release();

        app.listen(PORT, ()=> {
            console.log("Server is running on local host 5000");
        });

    }catch(error){
         console.error("connection failed: ",error);
         process.exit(1);
    }
};

startServer();