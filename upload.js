import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const bucketName = "corsa-general-bucket";
// S3 object key. Defaults to corsa-bundle.js; pass a key as the first CLI arg
// to deploy the same build under a different name, e.g.
//   node upload.js corsa-bundle-2.js
const fileKey = process.argv[2] ?? "corsa-bundle.js";
const localFilePath = "./dist-singlefile/bundle.js"; // Local file to upload

// Initialize S3 client
const s3 = new S3Client({ region: "us-west-1" }); // Change region as needed

async function replaceFile() {
  try {
    const fileStream = fs.createReadStream(localFilePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: fileStream,
      ContentType: "text/javascript",
    };

    await s3.send(new PutObjectCommand(uploadParams));
    console.log(`Successfully replaced ${fileKey} in ${bucketName}`);
  } catch (err) {
    console.error("Error replacing file:", err);
  }
}

replaceFile();