const express = require('express')
const router = express.Router()

//controller functions
const {signupUser,loginUser} = require('../controllers/userController')
const {getUsers, deleteUser, updateUser , getUserById} = require('../controllers/adminUserController')


//login route
router.post('/login', loginUser)

//signup route
router.post('/signup', signupUser)




//get all users (admin)
router.get('/', getUsers)

router.get('/:id', getUserById)

//delete user (admin)
router.delete('/:id', deleteUser)

//update user (admin)
router.patch('/:id', updateUser)



module.exports = router