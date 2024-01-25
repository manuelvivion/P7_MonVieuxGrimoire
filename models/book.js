const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema( //prepare a new schema included in rating (array field)
    {
        userId :{type: String, required: true},   //unique user id
        grade:{type: Number, required: true}
    }
);
const bookSchema = mongoose.Schema({
  userId :{type: String, required: true},   //unique user id
  title: { type: String, required: true }, //title of the book
  author: { type: String, required: true }, //author of the book
  imageUrl: { type: String, required: true }, //url of the cover of the book
  year: { type: Number, required: true }, //year of publication AS NUMBER
  genre: { type: String, required: true }, //genre of the book
  ratings : {type:[ratingSchema], required:true}, //list of all ratings for this book, AS ARRAY OF SCHEMA
  averageRating: {type: Number, required: true} //average note calculated upon the array of ratings; AS NUMBER
});

module.exports = mongoose.model('Book', bookSchema); //'Book' is the name of the model exported