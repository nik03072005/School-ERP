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

  const corsOriginEnv = process.env.CORS_ORIGIN || "https://erp.kidzgalaxy.org";
  const allowedOrigins = corsOriginEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Kidz Galaxy API Running");
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