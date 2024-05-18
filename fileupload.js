const OSS = require('ali-oss');


const client = new OSS({
    region: 'oss-ap-south-1', // Specify the region in which the bucket resides. Example: 'oss-cn-hangzhou'. 
    accessKeyId:"LTAI5tFZb6pXe8Ad351efk8i", // Make sure that the OSS_ACCESS_KEY_ID environment variable is configured. 
    accessKeySecret: "DL22DgR0HVTalT7nVOXCHip06JMIKI", // Make sure that the OSS_ACCESS_KEY_SECRET environment variable is configured. 
    bucket: 'super360', // Specify the name of the bucket. Example: 'my-bucket-name'. 
  });

//   AP:092db2dc-9854-4c16-9c28-3de45c062c27

const localFilePath = './recharge.svg'; // Replace with the actual path to your PNG file

async function uploadImage() {
    try {
        const result = await client.put('recharge.svg', localFilePath);
        console.log('Image uploaded successfully:', result.url);
    } catch (err) {
        console.error('Error uploading image:', err);
    }
}

uploadImage();

  