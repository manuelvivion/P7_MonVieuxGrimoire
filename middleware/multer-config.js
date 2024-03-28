const multer = require('multer');
/* const sharp = require("sharp");
const fs = require("fs"); */

const MIME_TYPES = { //list of possible MIME Types sent in the request
  'image/jpg': 'jpg', //depending on the MIME, we prepare the correct file extension
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.memoryStorage();

/* const storage = multer.diskStorage({ //configure the storage settings
  destination: (req, file, callback) => {
    console.log(file);
    callback(null, 'images');
  },
  filename: (req, file, callback) => { //prepare the filename, refactored from sent file
    const name = file.originalname.split(' ').join('_'); //replace ' ' by '_'
    const extension = MIME_TYPES[file.mimetype]; //get the correct file extension, depending on the List created above
    callback(null, name + Date.now() + '.' + extension); //we add timestamp to the name to avoid doublons
  }
}); */

module.exports = multer({storage: storage}).single('image'); //multer.single() -> method to store the file

