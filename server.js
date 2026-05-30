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

    } catch (error) {
        console.log(error);
    }
}

startServer();