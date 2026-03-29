import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import seedRoles from "./src/config/seedRoles.js";
import seedAdmin from "./src/config/seedAdmin.js";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";

dotenv.config();

const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedAdmin();

  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || "https://erp.kidzgalaxy.org";
  app.use(
    cors({
      origin: corsOrigin,
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

  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
};

startServer();