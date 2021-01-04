require('dotenv').config();
const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const connectToMongoDB = require("./config/_mongodb");

//Connecting Mongodb Database
connectToMongoDB();

const apiRoutes = require("./routes/api");
const PORT = 5000;

// Parsing the request bodys
app.use(
    cors({
        credentials: true,
        origin: [
            /https?:\/\/localhost:\d{4}/,
            "https://ecell.iitm.ac.in",
        ],
    })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(compression({ level: 9 }));
app.use("/api", apiRoutes);

app.listen(PORT, () => {
    console.log(`You are listening to Port ${PORT}`);
});
