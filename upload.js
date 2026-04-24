import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const bucketName = "corsa-general-bucket";
const fileKey = "corsa-bundle.js"; // S3 object key
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