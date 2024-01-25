const Book = require('../models/book');
const fs = require('fs'); //fs : file system -> accès au system de fichier

// --------- Create Book controller -------
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book); // req is formData, so we need to parse to JSON object
  delete bookObject._id; // delete id from request (mongoose will create id automatically)
  delete bookObject._userId; //security : we delete the id sent in request (possibly hacked) to retrieve the one from token (secured by auth middleware)
  const book = new Book({
      ...bookObject, //get every attribute from parsed book objezct
      userId: req.auth.userId, // add correct user Id from token decryption
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //add imageURL for the cover (filname prepared in multer-config middleware)
  });

  book.save() //save book object in the db (asynchrone)
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { 
    res.status(400).json( { error });
    console.log('erreur ajout', book);
  }) 
}; // End of Create Book controller


// --------- Get One Book controller -------
exports.getOneBook = (req, res, next) => {
  Book.findOne({ //findOne method to get a specific book from DB
    _id: req.params.id //we want the book with _id same as id sent in request
  }).then(
    (book) => { //book found
      res.status(200).json(book); //send response status as 200 (ok) and the selected book as Json object
    }
  ).catch(
    (error) => { //error : book not found
      res.status(404).json({ //Eroor 404 : book not found
        error: error //error description
      });
    }
  ); 
}; //End of get one book controller


// --------- Modify Book controller -------
// ATTN : Request can be in JSON, or String (if new image sent in request)
exports.modifyBook = (req, res, next) => { 
  const bookObject = req.file ? { //if file sent in request
      ...JSON.parse(req.body.book), //we parse req. to Json Object
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`//prepare the url of the new image
  } : { ...req.body }; // if no image sent, bookObject is strictly the same object sent in request

  delete bookObject._userId; //Security : we delete the userId sent in request (possibly hacked) to get the correct user id encrypted in token

  Book.findOne({_id: req.params.id}) //findOne method to get the book we want to modify
      .then((book) => { //if found
          if (book.userId != req.auth.userId) { //if userId incorrect (not same as the one in token)
              res.status(401).json({ message : 'Not authorized'}); //Err 401
          } else { //if correct user
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id}) //updateOne Method from mongoose (copy full bookObject + update Id with current id)
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      }); 
}; // End of Modify book Controller


// --------- Delete Book controller -------
exports.deleteBook = (req, res, next) => { 
  Book.findOne({ _id: req.params.id}) //we first select the book we want to delete
      .then(book => { //if found...
          if (book.userId != req.auth.userId) { //...we want to be sure that the user is the 'creator' of the book
              res.status(401).json({message: 'Not authorized'}); //if not ; ERR 401
          } else { // if user is 'creator'
              const filename = book.imageUrl.split('/images/')[1]; //we get the filename by splitting the full URL befor and after '/images/'
              fs.unlink(`images/${filename}`, () => { // FS unlink to delete file from local disk
                  Book.deleteOne({_id: req.params.id}) //if Unlink is OK => DeleteOne Method from mongoose to remove book from DB
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      }); 
}; //End of modify book controller



// --------- get all Books controller -------
exports.getAllBook = (req, res, next) => {
  Book.find().then( //find() method called for 'Book' model -> return all book objects
    (books) => {
      res.status(200).json(books); //return an array of JSON objects
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  ); 
}; // end of get all books controller