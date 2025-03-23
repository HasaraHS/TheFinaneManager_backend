const mongoose = require('mongoose')

const Schema = mongoose.Schema

const goalSchema = new Schema ({
    goalId:{type:String, required: true, unique: true},
    userId:{type: String, required: true}, // Link to user
    title:{type: String, required:true},
    amount:{ type: Number, required: true },
    savedAmount:{ type: Number, default: 0 }, 
    deadline: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ["In Progress", "Achieved", "Failed"], 
        default: "In Progress" 
    },
    description: {type:String}
}, {timestamps: true})

module.exports = mongoose.model("Goal",goalSchema)
