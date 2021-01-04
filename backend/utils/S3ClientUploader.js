const crypto = require("crypto");

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const REGION_NAME = "ap-south-1";
const MAX_FILE_SIZE = 200 * 1024 * 1024;

class S3SignedPolicy {
    constructor(bucketName) {
        this.bucket = bucketName;
        this.bucketAcl = "public-read";
        this.expirationStr = this.createExpDate();
        this.expirationStrClean = this.expirationStr.split(/[:\-.]/g).join("");
        this.amzCred = this.createAMZCred(this.expirationStrClean);
        this.encodedPolicy = this.createEncodedPolicy();
        this.sign = this.createSignedPolicy(this.encodedPolicy, this.expirationStrClean);
    }

    createExpDate() {
        let expirationDate = new Date();

        expirationDate.setMinutes(expirationDate.getMinutes() + 20);
        const expirationStr = expirationDate.toISOString();

        return expirationStr;
    }

    createAMZCred(cleanISOString) {
        const YYYYMMDD = cleanISOString.slice(0, 8);
        const amzCred = AWS_ACCESS_KEY_ID + "/" + YYYYMMDD + "/" + REGION_NAME + "/s3/aws4_request";

        return amzCred;
    }

    createSignedPolicy(encodedPolicy, cleanISOString) {
        let YYYYMMDD = cleanISOString.slice(0, 8);
        let kDate = crypto
            .createHmac("sha256", "AWS4" + AWS_SECRET_ACCESS_KEY)
            .update(YYYYMMDD)
            .digest("");
        let kRegion = crypto.createHmac("sha256", kDate).update(REGION_NAME).digest("");
        let kService = crypto.createHmac("sha256", kRegion).update("s3").digest("");
        let kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest("");

        let sign = crypto.createHmac("sha256", kSigning).update(encodedPolicy).digest("hex");

        return sign;
    }

    createEncodedPolicy() {
        const fileType = this.bucket.endsWith("avatars") || this.bucket.endsWith("images") ? "image/" : "";

        const s3Policy = {
            expiration: this.expirationStr,
            conditions: [
                { bucket: this.bucket },
                ["starts-with", "$key", ""],
                { acl: this.bucketAcl },
                ["content-length-range", 0, MAX_FILE_SIZE],
                ["starts-with", "$Content-Type", fileType],
                { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
                { "x-amz-credential": this.amzCred },
                { "x-amz-date": this.expirationStrClean },
            ],
        };

        let encodedPolicy = Buffer.from(JSON.stringify(s3Policy)).toString("base64");
        return encodedPolicy;
    }
}

module.exports = { S3SignedPolicy };
