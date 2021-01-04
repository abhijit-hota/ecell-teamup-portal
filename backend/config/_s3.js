const AWS = require("aws-sdk");

const { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID } = process.env;
const ecellBuckets = { "team-up": "team-up-student-cvs" };

/**
 * Takes the event names as params and return the S3 instance and bucketName
 * @param {('startup-series' | 'edd-portal' | 'team-up')} eventName The event name for which the bucket was created.
 * @returns {{s3: AWS.S3, bucketName: String}} {s3, bucketName}
 */
const getS3Bucket = (eventName) => {
	if (!ecellBuckets.hasOwnProperty(eventName)) {
		throw new Error(
			`No bucket found for event ${eventName}. Please check the ecellBuckets object in config/_s3.js.`
		);
	} else {
		//The following credentials only control the AWS S3 bucket created in Abhijit's account for E-Cell
		const credentials = new AWS.Credentials({
			accessKeyId: AWS_ACCESS_KEY_ID,
			secretAccessKey: AWS_SECRET_ACCESS_KEY,
		});

		AWS.config.update({ credentials, region: "ap-south-1" });

		const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
		const bucketName = ecellBuckets[eventName];

		return { s3, bucketName };
	}
};

module.exports = getS3Bucket;