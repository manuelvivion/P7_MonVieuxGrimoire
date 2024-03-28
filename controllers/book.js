const Book = require('../models/book');
const User = require('../models/user');
const fs = require('fs'); //fs : file system -> accès au system de fichier

// --------- Create Book controller -------
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book); // req is formData, so we need to parse to JSON object
  delete bookObject._id; // delete id from request (mongoose will create id automatically)
  delete bookObject._userId; //security : we delete the id sent in request (possibly hacked) to retrieve the one from token (secured by auth middleware)
  delete bookObject.ratings; // delete rating sent in req
  delete bookObject.averageRating; //delete rating sent in req
  
  
  const book = new Book({
      ...bookObject, //get every attribute from parsed book objezct
      ratings:[], //init an empty array : no ratings yet
      averageRating:0, //initial average rating = 0
      userId: req.auth.userId, // add correct user Id from token decryption
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //add imageURL for the cover (filname prepared in multer-config middleware)
  });

  book.save() //save book object in the db (asynchrone)
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { 
    res.status(400).json( { error });
    console.log('erreur ajout',error.message, book);
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
  let bookObject = {};
  let imageChange = false; // boolean, change cover fimage file?

  if(req.file){ //if file sent in request
      bookObject = {...JSON.parse(req.body.book), //we parse req. to Json Object
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`//prepare the url of the new image
      }
      imageChange=true; //change image needed
    } 
  else { // no file sent in request
    bookObject = { ...req.body };// if no image sent, bookObject is strictly the same object sent in request
    }

  delete bookObject._userId; //Security : we delete the userId sent in request (possibly hacked) to get the correct user id encrypted in token

  Book.findOne({_id: req.params.id}) //findOne method to get the book we want to modify
      .then((book) => { //if found
          if (book.userId != req.auth.userId) { //if userId incorrect (not same as the one in token)
              res.status(403).json({ message : '403: unauthorized request '}); //Err 401
          } else { //if correct user

              if(imageChange){ //change cover image -> let's delete the former image file for this book 
                    const filename = book.imageUrl.split('/images/')[1]; //we get the filename by splitting the full URL befor and after '/images/'
                    fs.unlink(`images/${filename}`, (err => {
                      if(err) {
                       throw err;
                      }
                    })); 
                    
              }

              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id}) //updateOne Method from mongoose (copy full bookObject + update Id with current id)
              .then(() => res.status(200).json({message : 'livre modifié!'}))
              .catch(error => res.status(401).json({message:"error 401 : problème lors de la mise à jour du livre"}));
          }
      })
      .catch((error) => {
          res.status(400).json({message:"livre à modifier introuvable"});
      }); 
}; // End of Modify book Controller




// --------- Modify Book Rating controller -------
exports.modifyBookRating = (req, res, next) => { 
  console.log('modif rating en cours');
  let errorMsg=""; //message created to catch all errors / no errors => errorMsg stay empty string

  delete req.body._userId; //Security : we delete the userId sent in request (possibly hacked) to get the correct user id encrypted in token

  //tester la présence du user dans la DB
    User.findOne({_id:req.auth.userId})
      .then(/* (user)=>{
        if(!user){errorMsg+="Utilisateur non présent dans la base de données"}
      } */)
      .catch((error)=>{errorMsg+="Utilisateur non présent dans la base de données"})
  // fin test presence user dans la DB

  Book.findOne({_id: req.params.id}) //findOne method to get the book we want to modify
      .then((book) => { //if found
         
          // Verify the new grade is between 0 and 5
          if (req.body.rating < 0 || req.body.rating > 5 ) {
             errorMsg+="valeur de la note attribuée incorrecte";
          }

          //Verify the user did not already rate this book
          let alreadyRated = false;
          book.ratings.map((notes)=>{
            if (notes.userId === req.auth.userId) {
              alreadyRated=true;
              errorMsg +="Cet utilisateur a déjà noté ce livre.";
            }
          });

          if(errorMsg===""){ //no error happened (bad grade or already rated)

              //1 - Add new rating to current list of ratings for this book
              let tempRatings=book.ratings;
              tempRatings.push({
                userId:req.auth.userId,
                grade :req.body.rating
               });

              //2 - Average rate calculation
               let total =0;
               tempRatings.map((note)=>total+=note.grade); // cumul de toutes les notes
               let newAverage = Math.round(total/tempRatings.length); //divided by number of rates, rounded (Math.round) to closest integer

              //3 - update book with new rating added, average rate updated
              Book.updateOne({ _id: req.params.id}, {ratings: tempRatings,averageRating: newAverage, _id: req.params.id}) //updateOne Method from mongoose (copy full bookObject + update Id with current id)
              .then (() => {
                  Book.findOne({_id: req.params.id}) //findOne method to get the book we want to modify
                   .then((book) => { //if found
                    res.status(200).json(book);
                    console.log("book renvoyé ",book.averageRating);
                   }
                   )
                   .catch(error => { //catch Error sur le Find One
                    res.status(402).json({message:"impossible de récupérer le livre modifié"});
                    console.log("erreur modif note 402");
                  });

                 }
                )
                .catch(error => { //catch error sur le UpdateOne
                  res.status(401).json({message:"problème de modification de la note du livre"});
                  console.log("erreur modif note 401");
                });

              } //end if no error
              else{ // error de grade or already rated
                res.status(403).json({message:errorMsg});
                console.log("erreur modif note 403, mauvaise note ou déjà notée");
              }
          
      }) 
      .catch((error) => { //catch error first findOne
          res.status(400).json({message:"impossible de trouver le livre à modifier"});
          console.log("erreur modif note 400");
      }); 
}; // End of Modify book Controller



// --------- Delete Book controller -------
exports.deleteBook = (req, res, next) => { 
  Book.findOne({ _id: req.params.id}) //we first select the book we want to delete
      .then(book => { //if found...
          if (book.userId != req.auth.userId) { //...we want to be sure that the user is the 'creator' of the book
              res.status(403).json({message: '403: unauthorized request '}); //if not ; ERR 401
          } else { // if user is 'creator'
              const filename = book.imageUrl.split('/images/')[1]; //we get the filename by splitting the full URL befor and after '/images/'
              fs.unlink(`images/${filename}`, () => { // FS unlink to delete file from local disk
                  Book.deleteOne({_id: req.params.id}) //if Unlink is OK => DeleteOne Method from mongoose to remove book from DB
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({message:"problème à la suppression du livre"}));
              });
          }
      })
      .catch( error => {
          res.status(500).json({message:"erreur 500 : Impossible de trouver le livre à supprimer"});
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


// --------- get 3 best Books controller -------
exports.getBestRating = (req, res, next) => {
  console.log('best of commencé');
  Book.find().sort({averageRating: 'desc' }) //-> return  all books, sorted by descending average Rating
  .then( 
    (books) => {
      res.status(200).json(books.slice(0,3)); //return an array of first 3 items (slice(0,3)) of JSON objects
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  ); 
}; // end of get 3 best  books controller
