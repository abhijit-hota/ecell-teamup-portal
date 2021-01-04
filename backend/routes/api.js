const express = require("express");
const apiRouter = express.Router();
const teamUpPortal = require("./teamUpPortal");

apiRouter.use("/team-up-portal", teamUpPortal);

module.exports = apiRouter;
