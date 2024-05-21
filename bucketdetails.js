// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// // Set up your AWS credentials (usually via environment variables)
const accessKey = "AKIASXYRQD2WIYSQLMPI";
const secretAccessKey = "y4x/rsyzDb0Iq8tANd8MlAbMBvqmgPH85HfVDe42";
const bucketName = "cdn.sixgames.fun"; // Replace with your actual bucket name

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const sharp = require("sharp");
const { generateUuid } = require("./functions");

async function uploadFile(file) {
  const s3 = new S3Client({
    region: "eu-north-1", // Replace with your desired region
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
    },
  });

  var filetype = file.filename.substr(file.filename.lastIndexOf(".") + 1);

  if (
    filetype == "jpg" ||
    filetype == "jpeg" ||
    filetype == "png" ||
    filetype == "webp"
  ) {
    const filenamenew = generateUuid() + "." + filetype;

    const params = {
      Bucket: bucketName,
      Key: `images/${filenamenew}`, // Specify the desired S3 object key
      Body: await sharp(await file.toBuffer())
        .resize({
          width: 110,
          height: 110,
          withoutEnlargement: false,
          withoutReduction: false,
          fastShrinkOnLoad: true,
        }) // Adjust the width as needed
        .toBuffer(), // Use the local file buffer
    };
    // return {
    //     "error":false,
    //     "img":`https://storagesixgames.s3.eu-north-1.amazonaws.com/images/${file.filename}`
    // }

    var s3resp = await s3
      .send(new PutObjectCommand(params))
      .catch(function (ee) {
        return {
          error: true,
        };
      });

    if (s3resp.$metadata["httpStatusCode"] == 200) {
      return {
        error: false,
        img: `https://cdn.sixgames.fun/images/${filenamenew}`,
      };
    } else {
      return {
        error: true,
      };
    }
  } else {
    return {
      error: true,
    };
  }
}

module.exports = {
  uploadFile,
};
