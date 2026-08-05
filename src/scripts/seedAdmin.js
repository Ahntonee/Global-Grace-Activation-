/*
 * One-time bootstrap: creates the first admin account from ADMIN_SEED_EMAIL /
 * ADMIN_SEED_PASSWORD in .env. Public self-registration is intentionally
 * disabled (see authRoutes.js) — this script is the only way to create the
 * very first account. Safe to re-run: it's a no-op if an admin already exists.
 *
 * Usage: node src/scripts/seedAdmin.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env");
    process.exit(1);
  }

  await connectDB();

  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    console.log(`An admin account already exists (${existingAdmin.email}) — nothing to do.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const existingByEmail = await User.findOne({ email: email.toLowerCase() });

  if (existingByEmail) {
    existingByEmail.role = "admin";
    await existingByEmail.save();
    console.log(`Existing user ${existingByEmail.email} promoted to admin.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = await User.create({
    fullName: "Site Administrator",
    email,
    password,
    role: "admin",
  });

  console.log(`Admin account created: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin account:", err.message);
  process.exit(1);
});
