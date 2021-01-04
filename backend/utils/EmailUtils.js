const configSendGrid = require("../config/_sendgrid");
const sg = configSendGrid();

const { WEBOPS_EMAIL } = process.env;

/**
 * Send password reset mails
 * @param {string} eventName The Event for which the E-Mail is being sent
 * @param {string} recipientMail The recipient's E-Mail ID
 * @param {string} resetCode The password change token
 * @param {string} senderMail The sender's E-Mail ID. Default: WebOps GMail
 */

async function sendPasswordResetMail(eventName, recipientMail, resetCode, senderMail = WEBOPS_EMAIL) {
	await sg.send({
		from: senderMail,
		to: recipientMail,
		subject: `${eventName} Password Reset`,
		html: `
            <span style="font-size: large;">Here's your password reset code for ${eventName}: </span>
            <br/> 
            <h1 style="text-align: center;">${resetCode}</h1>
            `,
	});
	console.log(`E-Mail sent to ${recipientMail}`);
}

/**
 * TeamUp specific: Send mail on selection of a project
 *
 * @param {string} recipientMail The recipient's E-Mail ID
 * @param {{title: string, mentorName: string}} projectDetails The details of the project in which the recipient got selected
 * @param {string} senderMail  The sender's E-Mail ID. Default: WebOps GMail
 */
async function sendSelectionMail(recipientMail, projectDetails, senderMail = WEBOPS_EMAIL) {
	await sg.send({
		from: senderMail,
		to: recipientMail,
		subject: `TeamUp, E-Cell IITM | Selected for ${projectDetails.title}`,
		html: `
            <h2>Congratulations!</h2>
            
            <h4>You have been selected by <strong>${projectDetails.mentorName}</strong> for their project: <strong>${projectDetails.title}</strong>
            
            Your contact details have been made available to them. Please wait for any further response for them.
            `,
	});
	console.log(`E-Mail sent to ${recipientMail}`);
}

/**
 * Send Verification mail to someone
 *
 * @param {string} eventName The name of the E-Cell event
 * @param {string} recipientMail
 * @param {string} verificationCode
 * @param {string} [senderMail = WebOps Gmail]
 */
async function sendVerificationMail(eventName, recipientMail, verificationCode, senderMail = WEBOPS_EMAIL) {
	console.log(recipientMail);
	await sg.send({
		from: senderMail,
		to: recipientMail,
		subject: `${eventName}, E-Cell IITM | Verification Code`,
		html: `
        <span style="font-size: large;">Thank you for registering for ${eventName}!</span>
        <br/>
        Here is your verification code: 
        <br/>
        <h1 style="text-align: center;">${verificationCode}</h1>
        `,
	});
	console.log(`Email sent to ${recipientMail}`);
}
module.exports = { sendPasswordResetMail, sendSelectionMail, sendVerificationMail };
