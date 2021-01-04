const mongoose = require("mongoose");

const teamUpProjects = new mongoose.Schema({
    title: { type: String },
    description: { type: String },

    // Duplication because in a project card, I just display the name
    // so it's better to create an indvidual field.
    mentorName: { type: String },
    mentorDesignation: { type: String },
    mentorID: { type: mongoose.SchemaTypes.ObjectId },

    skillsRequired: [{ type: String }],
    jobProfiles: [{ type: String }],
    teamMembersRequired: { type: Number },

    applicants: [{ type: mongoose.SchemaTypes.ObjectId }],
    shortlisted: [{ type: mongoose.SchemaTypes.ObjectId }],
    selected: [{ type: mongoose.SchemaTypes.ObjectId }],

    creationTime: { type: Number, default: Date.now() },
    lastUpdated: { type: Number, default: Date.now() },
});

teamUpProjects.pre("save", function (next) {
    const project = this;
    project.lastUpdated = Date.now();
    next();
});

teamUpProjects.pre("updateOne", function (next) {
    const project = this;
    project.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model("teamUpProjects", teamUpProjects);
