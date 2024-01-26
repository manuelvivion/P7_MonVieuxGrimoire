const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth'); //middleware created to decrypt token and retrieve user_id
const multer = require('../middleware/multer-config'); //middleware created to manage file storage

const bookCtrl = require('../controllers/book'); //import all Controllers functions from controllers/book.js

router.get('/', bookCtrl.getAllBook); //no auth middleware needed
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook); //no auth middleware needed
router.post('/', auth, multer, bookCtrl.createBook); //auth middleware added to get UserId from Token, multer middleware needed to manage file storage
router.post('/:id/rating', auth, bookCtrl.modifyBookRating);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;