const mongoose = require('mongoose')

const Schema = mongoose.Schema

const transactionSchema = new Schema ({
    transactionId:{type: String, required: true, unique: true},
    type:{
        type: String,
        enum:['income', 'expense'],
        required: true
    },
    category:{type: String, required: true},
    label:{type: String, required: true},
    amount:{type: Number, required: true},
    userId: {type: String, required: true}, // Link to user
    currency:{ type: String, required: true, default: 'USD' },
    recurringType: {
        type: String,
        enum:['monthly', 'daily', 'weekly', 'annually'],
    },
    description:{type: String},
    

}, {timestamps:true})


module.exports = mongoose.model("Transaction", transactionSchema)