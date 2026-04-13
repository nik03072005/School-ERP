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

  const normalizeOrigin = (value) => value.trim().toLowerCase().replace(/\/+$/, "");

  const trustedDefaultOrigins = ["https://erp.kidzgalaxy.org", "http://localhost:5173"];

  const envConfiguredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const corsOrigins = [...new Set([...trustedDefaultOrigins.map(normalizeOrigin), ...envConfiguredOrigins])];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server).
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = normalizeOrigin(origin);

        if (corsOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        console.warn(`CORS blocked for origin: ${origin}`);
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