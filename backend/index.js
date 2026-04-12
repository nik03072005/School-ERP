import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import seedRoles from "./src/config/seedRoles.js";
import seedAdmin from "./src/config/seedAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import schoolSetupRoutes from "./src/routes/schoolSetupRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";

dotenv.config();

const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedAdmin();

  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    corsOrigins.push("https://erp.kidzgalaxy.org", "http://localhost:5173");
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server).
        if (!origin || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("School ERP API Running");
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/student", studentRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/setup", schoolSetupRoutes);
  app.use("/api/attendance", attendanceRoutes);

  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
};

startServer();