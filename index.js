const dotenv = require("dotenv");
const express = require("express");
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const userRoute = require("./routes/userRoute");
const cors = require("cors");

dotenv.config();

connectDB();
const app=express()
app.use(cookieParser());

app.use(cors({ 
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: true 
}));

app.use(express.json());

app.get("/", (req, res) =>
  res.send('<h1>Welcome to "The DataTalks Ai" Backend </h1>')
);
app.use("/api/user", userRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

app.use(express.json());

