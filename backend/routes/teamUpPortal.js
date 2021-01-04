const express = require("express");
const router = express.Router();
const {
	login,
	logout,
	sendMailToUsers,
	updateProjectData,
	updateStudentData,
	getProjects,
	getS3SignedPolicy,
	postMentors,
	postProjects,
	registerParticipant,
	resetPasswordFromCode,
} = require("../controllers/TeamUpPortalController");

router.get("/projects", getProjects);
router.post("/register-participant", registerParticipant);
router.post("/login", login);
router.get("/logout/:userType", logout);
router.get("/s3-signed-policy/:bucketName", getS3SignedPolicy);
router.put("/update-student-info/:updateType", updateStudentData);
router.put("/update-project-info/:updateType", updateProjectData);

router.post("/mail/:type", sendMailToUsers);
router.post("/reset-password/:userType", resetPasswordFromCode);

// No-frontend routes for adding to database
router.post("/projects", postProjects);
router.post("/mentors", postMentors);

module.exports = router;
