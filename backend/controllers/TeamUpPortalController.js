const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Mentor = require("../models/mentor");
const Student = require("../models/participant");
const Project = require("../models/project");

const DBUtils = require("../utils/DBUtils")();
const verifyRequest = require("../utils/VerifyRequest");
const { S3SignedPolicy } = require("../utils/S3ClientUploader");
const { process400, process401, process404, process500, processData } = require("../utils/ResponseUtils");
const { sendPasswordResetMail, sendSelectionMail, sendVerificationMail } = require("../utils/EmailUtils");

const { TEAMUP_SIGNATURE_STRING } = process.env;
const AUTHTOKEN_NOT_FOUND = new Error("Not authorized");
AUTHTOKEN_NOT_FOUND.code = 9090;
const isProduction = process.env.NODE_ENV === "production";

exports.getProjects = async (req, res) => {
    try {
        verifyRequest(req);

        let allProjects = await DBUtils.getAllEntities(Project, {});
        const requestFor = req.query.for;

        if (!requestFor || (requestFor !== "student" && requestFor !== "admin")) throw new Error("Invalid 'for' query");

        //Do the filtering for student dashboard
        if (requestFor === "student") {
            let filteredProjects = allProjects.map((project) => {
                const { creationTime, lastUpdated, applicants, selected, ...filteredProject } = project._doc;
                return filteredProject;
            });
            processData(res, filteredProjects);
            return;
        } else if (requestFor === "admin") {
            processData(res, allProjects);
        }
    } catch (error) {
        if (error === "Invalid 'for' query") {
            process400(res, error);
        } else {
            process500(res, error.message ? error.message : error);
        }
    }
};

exports.registerParticipant = async (req, res) => {
    try {
        console.log(req.session);
        let hashedPassword = await bcrypt.hash(req.body.password, 10);

        let student = new Student({ ...req.body, password: hashedPassword });
        await DBUtils.saveEntity(student);

        let signedToken = jwt.sign({ studentID: student._id, email: student.email }, TEAMUP_SIGNATURE_STRING);
        res.cookie("ECELL_LOGGED_IN", "student");
        res.cookie("ECELL_AUTH_TOKEN", signedToken, {
            sameSite: true,
            httpOnly: true,
            secure: isProduction,
        });

        const { creationTime, lastUpdated, password, ...filteredStudent } = student._doc;
        res.clearCookie("ECELL_VERIFICATION_TOKEN");
        processData(res, filteredStudent);
    } catch (error) {
        if (error.code === 11000) {
            let duplicate = Object.getOwnPropertyNames(error.keyValue)[0];
            process400(
                res,
                `This ${
                    duplicate == "phone" ? "Contact No." : duplicate === "email" ? "E-Mail ID" : "Roll No."
                } is already associated to another account.`
            );
        } else {
            console.log(error);
            process500(res);
        }
    }
};

exports.login = async (req, res) => {
    try {
        let student = await DBUtils.getEntity(Student, { email: req.body.email });

        if (!student) {
            process404(res, "No account was found with the E-Mail.");
            return;
        }

        let credentialsCorrect = await bcrypt.compare(req.body.password, student.password);
        if (credentialsCorrect) {
            try {
                // Trial
                let signedToken = jwt.sign({ studentID: student._id, email: student.email }, TEAMUP_SIGNATURE_STRING);
                res.cookie("ECELL_LOGGED_IN", "student");
                res.cookie("ECELL_AUTH_TOKEN", signedToken, {
                    sameSite: true,
                    httpOnly: true,
                    secure: isProduction,
                });
            } catch (err) {
                console.log(err);
                res.status(500).send(err);
            }
            const { creationTime, lastUpdated, password, ...filteredStudent } = student._doc;
            processData(res, filteredStudent);
        } else {
            process401(res, "Wrong Password.");
        }
    } catch (error) {
        console.log(error);
        process500(res, "An error occured", error.message);
    }
};

exports.logout = async (req, res) => {
    try {
        verifyRequest(req);

        res.clearCookie(`ECELL_LOGGED_IN`);
        res.clearCookie(`ECELL_AUTH_TOKEN`);
        processData(res, "Logged out");
    } catch (err) {
        console.log(err.message);
        process500(res, err.message);
    }
};

exports.getS3SignedPolicy = async (req, res) => {
    try {
        verifyRequest(req);

        const signedPolicy = new S3SignedPolicy(req.params.bucketName);
        processData(res, signedPolicy);
    } catch (error) {
        process500(res, error.message);
    }
};

exports.updateStudentData = async (req, res) => {
    try {
        const { studentID } = verifyRequest(req);
        const updateType = req.params.updateType;

        if (updateType === "cv" || updateType === "avatar") {
            try {
                const { cvURL, avatarURL } = req.body;

                if (cvURL) {
                    await DBUtils.updateEntity(Student, { _id: studentID }, { cvURL, cvUploaded: true });
                } else if (avatarURL) {
                    await DBUtils.updateEntity(Student, { _id: studentID }, { avatarURL });
                }
                processData(res, "Successfully updated");
            } catch (error) {
                console.log(error);
                process500(res, error.message ? error.message : error);
            }
            return;
        }

        if (updateType === "project") {
            try {
                const { projectID } = req.body;

                await DBUtils.updateEntity(Student, { _id: studentID }, { $addToSet: { appliedProjects: projectID } });
                processData(res, "Successfully updated");
            } catch (error) {
                console.log(error);
                process500(res, error.message ? error.message : error);
            }
            return;
        }

        if (updateType === "data") {
            try {
                const { dataToUpdate } = req.body;

                await DBUtils.updateEntity(Student, { _id: studentID }, dataToUpdate);

                // Renaming the S3 key
                if (dataToUpdate.hasOwnProperty("name") || dataToUpdate.hasOwnProperty("roll")) {
                    const student = await DBUtils.getEntityForId(Student, studentID);
                    const { cvUploaded, cvURL: oldCvURL, name, roll } = student;

                    if (!cvUploaded) {
                        processData(res, dataToUpdate);
                        return;
                    }

                    const oldKey = oldCvURL.split("/").pop();
                    const newKey = `${name.replace(/ /g, "")}-${roll}-CV.pdf`;

                    const getS3Bucket = require("../config/_s3");
                    const { s3, bucketName } = getS3Bucket("team-up");
                    const bucketWriteUrl = `https://${bucketName}.s3.ap-south-1.amazonaws.com`;

                    await s3
                        .copyObject({
                            Bucket: bucketName,
                            CopySource: `${bucketName}/${oldKey}`,
                            Key: newKey,
                            ACL: "public-read",
                        })
                        .promise();

                    await DBUtils.updateEntity(Student, { _id: studentID }, { cvURL: `${bucketWriteUrl}/${newKey}` });

                    await s3.deleteObject({ Bucket: bucketName, Key: oldKey }).promise();

                    processData(res, { ...dataToUpdate, cvURL: `${bucketWriteUrl}/${newKey}` });
                } else {
                    processData(res, dataToUpdate);
                }
            } catch (error) {
                if (error.code === 11000) {
                    let duplicate = Object.getOwnPropertyNames(error.keyValue)[0];
                    process400(
                        res,
                        `This ${
                            duplicate == "phone" ? "Contact No." : duplicate === "email" ? "E-Mail ID" : "Roll No."
                        } is already associated to another account.`
                    );
                } else {
                    console.log(error);
                    process500(res, error.message ? error.message : error);
                }
            }
        }

        if (updateType === "password") {
            try {
                const { passwords } = req.body;

                const student = await DBUtils.getEntityForId(Student, studentID);

                let credentialsCorrect = await bcrypt.compare(passwords.currentPassword, student.password);

                if (credentialsCorrect) {
                    let hashedPassword = await bcrypt.hash(passwords.newPassword, 10);

                    await DBUtils.updateEntity(Student, { _id: studentID }, { password: hashedPassword });
                    processData(res, "Successfully changed password.");
                } else {
                    process400(
                        res,
                        "The current passsword you entered is wrong. Please ensure you've entered the correct password."
                    );
                    console.log("Wrong password for update");
                }
            } catch (error) {
                console.log(error);
                process500(res, error.message ? error.message : error);
            }
        }
    } catch (error) {
        console.log(error.message);
        if (error.message === "Not authorized") {
            process401(res, error);
            return;
        }
        process500(res);
    }
};

exports.sendMailToUsers = async (req, res) => {
    const mailType = req.params.type;

    if (mailType === "password-reset") {
        const userType = req.query.for;

        if (!userType || (userType !== "mentor" && userType !== "student")) {
            process400(res, "No query string");
            return;
        }
        try {
            const email = req.body.email;
            const user =
                userType === "student"
                    ? await DBUtils.getEntity(Student, { email })
                    : await DBUtils.getEntity(Mentor, { email });

            if (!user) {
                process400(res, "No account was found with the E-Mail.");
                return;
            }

            const pw = user.password;
            const code = crypto.createHash("md5").update(pw).digest("hex");

            if (isProduction) {
                await sendPasswordResetMail("TeamUp", email, code);
            } else {
                console.log("Use this code to reset password.", code);
            }

            processData(res, "E-Mail sent.");
        } catch (error) {
            console.log(error);
            process500(res, "Sorry. An error occured.");
        }
    }
    if (mailType === "selection") {
        try {
            const { studentMail, projectID } = req.body;
            const { title, mentorName } = await DBUtils.getEntityForId(Project, projectID);

            if (isProduction) {
                await sendSelectionMail(studentMail, { title, mentorName });
            } else {
                console.log(`${studentMail} selected by ${mentorName} for ${title}`);
            }
            processData(res, "E-Mail sent.");
        } catch {
            console.log(error);
            process500(res, "Sorry. An error occured.");
        }
    }
    if (mailType === "verify-student") {
        try {
            const code = crypto.randomBytes(3).toString("hex");

            if (isProduction) {
                await sendVerificationMail("TeamUp", req.body.email, code);
            } else {
                console.log("Use this code to verify", code);
            }

            res.cookie("ECELL_VERIFICATION_TOKEN", code);
            processData(res, "Email Sent");
        } catch (error) {
            console.log(error);
            process500(res);
        }
    }
};

exports.resetPasswordFromCode = async (req, res) => {
    const userType = req.params.userType;
    if (!userType || (userType !== "mentor" && userType !== "student")) {
        process400(res, "No query string");
        return;
    }
    try {
        const { email, newPassword, resetCode } = req.body;
        const user =
            userType === "student"
                ? await DBUtils.getEntity(Student, { email })
                : await DBUtils.getEntity(Mentor, { email });

        if (!user) {
            process400(res, "No account was found with the E-Mail.");
            return;
        }
        const pw = user.password;
        const codeFromUser = crypto.createHash("md5").update(pw).digest("hex");

        const resetCodeCorrect = resetCode === codeFromUser;

        if (resetCodeCorrect) {
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = newHashedPassword;

            await DBUtils.saveEntity(user);

            processData(res, "Updated!");
        } else {
            process400(res, "Reset code is incorrect");
        }
    } catch (error) {
        console.log(error);
        process500(res, "Sorry. An error occured.");
    }
};

exports.updateProjectData = async (req, res) => {
    try {
        const { studentID } = verifyRequest(req);
        if (req.params.updateType === "apply") {
            const { projectID } = req.body;

            if (!studentID || !projectID) throw new Error("Nothing to update");

            await DBUtils.updateEntity(Project, { _id: projectID }, { $addToSet: { applicants: studentID } });
            processData(res, { msg: "Successfully updated", studentID });
        }
    } catch (error) {
        console.log(error);
        process500(res, error.message ? error.message : error);
    }
};

// Routes for inserting entities
exports.postProjects = async (req, res) => {
    try {
        let data = await DBUtils.bulkInsertEntities(Project, req.body.projects);
        processData(res, data);
    } catch (error) {
        process500(res, error.message ? error.message : error);
    }
};

exports.postMentors = async (req, res) => {
    try {
        const updatedMentors = req.body.mentors.map((mentor) => {
            const pw = bcrypt.hashSync(mentor.password, 10);
            const updatedMentor = { ...mentor, password: pw };

            return updatedMentor;
        });
        let data = await DBUtils.bulkInsertEntities(Mentor, updatedMentors);
        processData(res, data);
    } catch (error) {
        console.log(error);
        process500(res, error.message ? error.message : error);
    }
};

