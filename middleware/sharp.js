
const sharp = require("sharp");
// const fs = require("fs");

module.exports = async (req, res, next) => {
    // console.log(req.file);
    if(req.file){ // if file is sent (in case of update route)

        try {
            
            const { buffer, originalname } = req.file;
            const timestamp = Date.now();
            const name = originalname.split(' ').join('_'); //replace ' ' by '_'
            const ref = `${name}-${timestamp}.webp`;
            req.file.filename=ref;
            //console.log(ref);
            
            await sharp(buffer)
            .resize({ width: 400 })
            .webp({ quality: 20 })
            .toFile("images/"+ref);
            
            next(); //we 'transfer' the file to the rest of the route
            
        } catch(error) {
            res.status(500).json({ error }); // Err 500 
            
        }
    }
    else{
        next(); //we pass to controller
    }
  };