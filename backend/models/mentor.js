const mongoose = require("mongoose");

const teamUpMentor = new mongoose.Schema({
    name: { type: String },
    designation: { type: String },

    email: { type: String, lowercase: true },
    password: { type: String },

    projects: [{ type: mongoose.SchemaTypes.ObjectId }],
    contact: { type: String },
    avatarURL: { type: String },

    creationTime: { type: Date, default: Date.now() },
    lastUpdated: { type: Date, default: Date.now() },
});

teamUpMentor.pre("save", function (next) {
    const mentor = this;
    mentor.lastUpdated = Date.now();
    next();
});

teamUpMentor.pre("updateOne", function (next) {
    const mentor = this;
    mentor.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model("teamUpMentors", teamUpMentor);
