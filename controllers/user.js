const User = require('../models/user');
const bcrypt = require('bcrypt'); // to hash the password
const jwt = require('jsonwebtoken'); // to manage token creation and encryption

const dotenv =require ('dotenv'); // <--- (1)
// Initialize configuration : copy .env variables in process.env
dotenv.config(); // <--- (2)


// --------- Sign Up controller -------
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) // hashing (salt :10) the password included in the request (asynchrone)
      .then(hash => { //if hashing is ok
        const user = new User({ //create a new user model
          email: req.body.email, //email from request
          password: hash //hashed password
        });
        user.save() // save user with mongoose save() method (asynchrone) 
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' })) //creation OK
          .catch(error => res.status(400).json({ error })); //PRobleme
      })
      .catch(error => res.status(500).json({ error })); //Server problem
  }; // end of Signup Controller


// --------- Login controller -------
  exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) //mongoose findOn() Method to find the user in the db (asynchrone)
        .then(user => {
            if (!user) { //can't find the selected user in the DB
                return res.status(401).json({ error: 'Utilisateur non trouvé !' }); // Authentication error
            } // Selected user in the DB :
            bcrypt.compare(req.body.password, user.password) //bcrypt compare the hashed password in the db with the 'raw' password sent in the request
                .then(valid => {
                    if (!valid) { //user in the DB but Invalid PAssword
                        return res.status(401).json({ error: 'Mot de passe incorrect !' }); //ERR 401 , Authentication Error
                    }
                    res.status(200).json({ //User in the DB AND correct PAssword
                        userId: user._id,
                        token: jwt.sign( // token creation including User_id (from db)
                            { userId: user._id }, //value to crypt
                            process.env['TOKENKEY'], //crypting key
                            { expiresIn: '24h' } //token duration
                        )
                    });
                    
                })
                .catch(error => res.status(500).json({ error })); // Server Rrror
        })
        .catch(error => res.status(500).json({ error })); // Server Rrror
 };// end of login Controller