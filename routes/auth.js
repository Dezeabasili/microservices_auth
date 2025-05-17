const express = require('express')
const fileUpload = require('express-fileupload')
const authController = require('./../controllers/authController')
const usersController = require('./../controllers/usersController')
// const registerController = require('./../controllers/authController')
const renew_access_token = require('./../controllers/renewAccessToken')
const logout = require('./../controllers/logoutController')
const upload_file = require('./../controllers/uploadfile')
const generateSignature = require('./../controllers/cloudinaryController')
const verifyAccessToken = require('./../middlewares/verifyJWT')
const verifyRoles = require('./../middlewares/verifyRoles')

const router = express.Router()

router.post('/register', authController.register)
router.post('/verifyemail/', authController.verifyEmail)
router.post('/login', authController.login)
router.get('/renew_access_token', renew_access_token)
router.get('/logout', logout)
router.post('/upload', verifyAccessToken, fileUpload({ createParentPath: true }), upload_file)
router.post('/generatesignature', verifyAccessToken, generateSignature)
router.post('/forgotpassword', authController.forgotPassword)
router.post('/changepassword',verifyAccessToken, authController.changePassword)
router.post('/resetpassword/:resettoken/:user_id', authController.resetPassword)



// router.route('/allusers')
//     .get(verifyAccessToken, verifyRoles(2030), usersController.getAllUsers)
router.route('/allusers')
    .get(usersController.getAllUsers)

router.get('/usercategories', usersController.usersByCategories)

router.post('/hotelstaff', usersController.getHotelStaff)

router.post('/forgotpassword', authController.forgotPassword)

router.post('/finduser', verifyAccessToken, verifyRoles(2030), usersController.findUser)

router.patch('/resetpassword/:token/:id', authController.resetPassword)

router.patch('/changepassword', verifyAccessToken, authController.changePassword)

router.patch('/updatemyaccount', verifyAccessToken, usersController.updateMyAccount)

router.patch('/updateuser', verifyAccessToken, verifyRoles(2030), usersController.updateUser)

router.delete('/deletemyaccount', verifyAccessToken, usersController.deleteMyAccount)

router.get('/myaccount', verifyAccessToken, usersController.seeMyAccount)

router.get('/myaccount/myphoto', verifyAccessToken, usersController.seeMyPhoto)

router.delete('/myaccount/deletemyphoto', verifyAccessToken, usersController.deleteMyPhoto)

router.post('/subscriptions', usersController.handleSubscription)



router.route('/:user_id')
    .get(usersController.getUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)






module.exports = router