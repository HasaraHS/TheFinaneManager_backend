const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reportSchema = new Schema({
    reportId:{type:String, required: true, unique: true},
    userId:{type: String, required: true}, // Link to user
    totalIncome : {type: Number, default: 0},
    totalExpenses: { type: Number, default: 0 },
    savings:{ type: Number, default: 0 },
    categoryExpenses: { type: Map, of: Number, default: {} },  //Map fnction store data as key value pair
    budgetAllocated: { type: Number, default: 0 },
    budgetRemaining: { type: Number, default: 0 },
    startDate: { type: Date, required: true }, // Filter by date range
    endDate: { type: Date, required: true },
    categoryFilter: { type: String, default: null }, // Filter by category
    tagFilter: { type: [String], default: [] }, // Filter by tags
    recommendations: { type: String, default: "" }


}, {timestamps: true})

module.exports = mongoose.model("Report",reportSchema)