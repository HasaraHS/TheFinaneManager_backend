const mongoose = require('mongoose')

const Schema = mongoose.Schema

const budgetSchema = new Schema ({
    budgetId:{type: String, required: true, unique: true},
    userId:{type: String, required: true}, // Link to user
    month:{type: Number, required: true},
    amount: { type: Number, required: true },
    spentAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: function() { return this.amount - this.spentAmount; } },
    status: { type: String, enum: ['Active', 'Exceeded', 'Completed'], default: 'Active' },

}, {timestamps: true})

module.exports =  mongoose.model("Budget", budgetSchema)