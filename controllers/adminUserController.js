const mongoose = require('mongoose')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')

//get all regular users (admin view)
const getUsers = async (req, res) => {
    try{
        const users = await User.find({role:"regular"}).sort({createdAt:-1})

        res.status(200).json(users)
    } catch (error){
        res.status(500).json({error:'Failed to fetch regular users'})
    }
}

//get users by there id
const getUserById = async (req, res) => {

    const { id }= req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:"No such regular user"})
    }

    try{
        const users = await User.findByIdAndUpdate({_id: id},{
            ...req.body
        });

        res.status(200).json(users)
    } catch (error){
        res.status(500).json({error:'Failed to fetch regular users'})
    }
}

//delete regular user
const deleteUser = async (req, res) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:"No such regular user"})
    }

    const user = await User.findOneAndDelete({_id: id})

    if(!user){
        return res.status(404).json({error: "No such regular user"})
    }

    res.status(200).json(user)
}



//update regular user
const updateUser = async (req, res) => {
    const {id} = req.params
    const {name, email, password, role} =  req.body

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:"No such regular user"})
    }

    let updateFields = {}

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;

    if(password){
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.password = hashedPassword
    }

    const user = await User.findOneAndUpdate({_id: id}, 
        { $set: updateFields }
    )

    if(!user){
        return res.status(404).json({error: "No such regular user"})
    }

    res.status(200).json(user)

}  



module.exports = {getUsers, deleteUser, updateUser , getUserById}