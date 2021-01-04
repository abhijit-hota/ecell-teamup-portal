const { SENDGRID_API_KEY } = process.env;
const sgMail = require("@sendgrid/mail");

const configSendGrid = () => {
    sgMail.setApiKey(SENDGRID_API_KEY);
    return sgMail;
};

module.exports = configSendGrid;
