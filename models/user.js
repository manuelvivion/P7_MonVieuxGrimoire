const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } // string will be hashed in the controller
});

userSchema.plugin(uniqueValidator); // plugin used to confirm the unique email

module.exports = mongoose.model('User', userSchema); //'User' is the name of the model exported to other files