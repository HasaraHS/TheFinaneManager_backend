const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

const createToken = (_id) => {
 return jwt.sign({_id},process.env.SECRET, {expiresIn: '3d'})
}


//login user
const loginUser = async (req,res) => {
   const {email, password} = req.body
    
   try{
    const user = await User.login(email,password)

   //create a token
   const token = createToken(user._id)
   
   //check the role 
   const message = user.role == 'admin'
   ? "Admin login successful!" 
   : "Regular user login successful!";

    res.status(200).json({message, email, role:user.role, token, id:user.userId})
   }catch (error) {
    res.status(400).json({error: error.message})

  }
}



//signup user
const signupUser = async (req,res) => {
   const {name,email, password,role} = req.body

   try{
       const user = await User.signup(name,email,password,role)

     //create a token
     const token = createToken(user._id)

       res.status(200).json({message:"Create Account successful!", email, token})
   }catch (error) {
    res.status(400).json({error: error.message})

   }
}



module.exports = {signupUser, loginUser}