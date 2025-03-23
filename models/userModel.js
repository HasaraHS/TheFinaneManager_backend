const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const {v4 : uuidv4} = require('uuid')

const Schema = mongoose.Schema

const userSchema = new Schema({
    userId:{type: String, required: true, unique: true},
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {
        type: String,
        enum: ['admin','regular'],
        default: 'regular'
    },
}, {timestamps: true})


//function to generate a user ID
const generateUserId = () => {
    const randomNumber = Math.floor(10000 + Math.random() * 900000)
    return `UI-${randomNumber}`
}


//static signup method
userSchema.statics.signup = async function( name, email, password, role)  {

    //validation
     if(!email || !password){
        throw Error('All fields must be filled')
     }
     if(!validator.isEmail(email)){
        throw Error('Email is not valid')
     }
    if(!validator.isStrongPassword(password)){
        throw Error('Password not strong enough')
    }

    const exists = await this.findOne({email})

    if(exists){
        throw Error('Email already in use')
    }

    const salt = await bcrypt.genSalt(10)

    //hash password
    const hash = await bcrypt.hash(password, salt)

    const userId = await generateUserId(this)

    const user = await this.create({userId, name, email, password:hash, role})

    return user
}


//static login method
userSchema.statics.login = async function(email, password){

     //validation
     if(!email || !password){
        throw Error('All fields must be filled')
     }

    const user = await this.findOne({email})

    if(!user){
        throw Error('Incorrect email')
    }

    //match password
    const match = await bcrypt.compare(password, user.password)

    if(!match){
        throw Error('Incorrect password')
    }

    return user
}

module.exports = mongoose.model("User", userSchema)