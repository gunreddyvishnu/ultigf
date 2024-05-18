const fs=require("fs");


const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);

async function upload (req, res) {

  console.log("Received POST request to /upload");


  const data = await req.file();


  console.log(data);

  if(data){


    const timestamp = Date.now();
    const filename = `images/${timestamp}_${data.filename}`;
  
    // Save the file to disk
    await pump(data.file, fs.createWriteStream(filename));

    res.status(200).send("hey");
  }


  else{

    res.status(400).send("hey");

  }


  // The name of the input field (i.e. "image") is used to retrieve the uploaded file
//   let image = req.files.image;

 

//   // Add the timestamp to the image name
//   image.name = Date.now() + "_" + image.name;

  // Check if the folder exists, if not create it
  

  // Move the uploaded image to our upload folder
 

  // All good
 
};




module.exports={upload};


