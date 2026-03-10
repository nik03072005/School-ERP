import Role from "../models/Role.js";

const ROLES = ["admin", "teaching_staff", "non_teaching_staff", "student"];

const seedRoles = async () => {
  try {
    for (const name of ROLES) {
      await Role.updateOne({ name }, { name }, { upsert: true });
    }
    console.log("Roles seeded successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

export default seedRoles;
