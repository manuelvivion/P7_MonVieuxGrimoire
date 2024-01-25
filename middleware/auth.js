const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
    console.log(req.headers);
   try {
       const token = req.headers.authorization.split(' ')[1]; //se débarrasser de bearer
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); //Decrypt token with initial crypting string
       const userId = decodedToken.userId; //retrieve User Id  from token : for security
       req.auth = { //we add a new auth object to Req...
           userId: userId //...including User Id
       };
	next(); //we 'transfer' auth to the rest of the route
   } catch(error) {
       res.status(401).json({ error }); // Err 401 : authentication
       
   }
};