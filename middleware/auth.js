const jwt = require('jsonwebtoken');

const dotenv =require ('dotenv'); // <--- (1)
// Initialize configuration : copy .env variables in process.env
dotenv.config(); // <--- (2)

module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1]; //se débarrasser de bearer
       const decodedToken = jwt.verify(token, process.env['TOKENKEY']); //Decrypt token with initial crypting string
       const userId = decodedToken.userId; //retrieve User Id  from token : for security
       req.auth = { //we add a new auth object to Req...
           userId: userId //...including User Id
       };
	next(); //we 'transfer' auth to the rest of the route
   } catch(error) {
       res.status(401).json({ error }); // Err 401 : authentication
       
   }
};