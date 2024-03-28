
const express = require('express');
const app = express();

const dotenv =require ('dotenv'); // <--- (1)
// Initialize configuration
dotenv.config(); // <--- (2)

const mongoose = require('mongoose');
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const path = require('path');

app.use(express.json()); // make to app able to read directly req objects as JSON

//connect to external mongooseDB
mongoose.connect(`mongodb+srv://${process.env['MONGO_LOGIN']}:${process.env['MONGO_PWD']}@monvieuxgrimoire.jxr3ioa.mongodb.net/?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use((req, res, next) => { //CORS Management by adding headers to Req.
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
   next();
 });

app.use('/api/books', bookRoutes); 
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images'))); //route added to manage the display of images
 

module.exports = app;