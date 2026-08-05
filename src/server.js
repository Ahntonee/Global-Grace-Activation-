require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;


connectDB();

app.listen(PORT, () => {
    console.log(`
Global Grace Backend Started
Environment : ${process.env.NODE_ENV}
Port        : ${PORT}`);
});