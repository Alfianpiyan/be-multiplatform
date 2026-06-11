import dotenv from "dotenv";
import app from "./src/app.js";
import db from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {

        const connection = await db.getConnection();

        console.log("Database connected");

        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.timeout = 300000;         // Set timeout jadi 5 menit (dalam milidetik)
server.headersTimeout = 305000;

    } catch (error) {
        console.log(error);
    }
}

startServer();