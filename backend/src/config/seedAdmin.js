import User from "../models/User.js";
import Role from "../models/Role.js";

const seedAdmin = async () => {
  try {
    const adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      console.error("Admin role not found. Run seedRoles first.");
      return;
    }

    const existingAdmin = await User.findOne({ role_id: adminRole._id });
    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    await User.create({
      first_name: "Super",
      last_name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role_id: adminRole._id,
      status: "approved",
      is_active: true,
      profile_completed: true,
    });

    console.log(`Admin account created: ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};

export default seedAdmin;
