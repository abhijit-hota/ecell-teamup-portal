const mongoose = require("mongoose");

const teamUpParticipant = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    roll: { type: String, unique: true, uppercase: true },
    phone: { type: String, unique: true },
    branch: { type: String },
    yearOfStudy: { type: String },

    cvUploaded: { type: Boolean },
    cvURL: { type: String },
    avatarURL: { type: String },
    // cvURL: [{projectID, cvURL}];

    appliedProjects: [{ type: mongoose.SchemaTypes.ObjectId }],
    selectedProjects: [{ type: mongoose.SchemaTypes.ObjectId }],

    creationTime: { type: Number, default: Date.now() },
    lastUpdated: { type: Number, default: Date.now() },
});

teamUpParticipant.pre("save", function save(next) {
    const participant = this;
    participant.lastUpdated = Date.now();
    next();
});

teamUpParticipant.pre("updateOne", function updateOne(next) {
    const participant = this;
    participant.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model("teamUpParticipants", teamUpParticipant);
