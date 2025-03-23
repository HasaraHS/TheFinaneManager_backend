const mongoose = require('mongoose')
const Budget = require ('../models/budgetModel')
const Transaction = require('../models/transactionModel')
 
//create budget
const createBudget = async(req, res) => {
    const {userId, month, amount, spentAmount,remainingAmount, status} = req.body

    // Ensure transactionId is generated
    const budgetId = `BI-${Math.floor(1000 + Math.random() * 900000)}`;

    //add to db
    try{
        const budget = await Budget.create({budgetId,userId,month,amount,spentAmount,remainingAmount,status})
        res.status(200).json(budget)
    } catch(error){
       res.status(400).json({error: error.message})
    }
}

//get all budget
const getBudgets = async (req,res) => {
    const budgets = await Budget.find({}).sort({createdAt: -1})

    res.status(200).json(budgets)
}

//delete budget
const deleteBudget = async (req,res) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error:"No such budget entry"})
        }

    const budget = await Budget.findOneAndDelete({_id : id})

    if(!budget){
        return res.status(404).json({error:"No such budget entry"})
    }

    res.status(200).json(budget)
} 

//update budget
const updateBudget = async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such budget entry" });
    }

    // Destructure allowed fields
    const { month, amount, spentAmount } = req.body
    let updateFields = {}

    if (month !== undefined) updateFields.month = month
    if (amount !== undefined) updateFields.amount = amount
    if (spentAmount !== undefined) updateFields.spentAmount = spentAmount

    // Auto-calculate remainingAmount if amount and/or spentAmount are updated
    if (amount !== undefined || spentAmount !== undefined) {
        const existingBudget = await Budget.findById(id);
        if (!existingBudget) {
            return res.status(404).json({ error: "No such budget entry" });
        }

        // If spentAmount is provided, use it; otherwise, keep existing
        const newSpent = spentAmount !== undefined ? spentAmount : existingBudget.spentAmount
        const newAmount = amount !== undefined ? amount : existingBudget.amount
        
        updateFields.remainingAmount = newAmount - newSpent
    }

    try {
        // Find and update the budget entry
        const updatedBudget = await Budget.findByIdAndUpdate(id, updateFields, { new: true })

        if (!updatedBudget) {
            return res.status(404).json({ error: "No such budget entry" })
        }

        res.status(200).json(updatedBudget);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" })
    }
}

//get all the budget of specific user 
const getBudgetsByUserId = async (req,res) => {
    try{
        const {userId} = req.params
        const budgets = await Budget.find({userId})
        res.status(200).json(budgets)

    }catch (error){
        res.status(500).json({ error: "Internal Server Error", details: error.message })

    }
}

//get specific user one month budget and calculate all the transaction (expences) of that user and notify user and patterns
const getUserMonthlyBudgetAndExpenses = async (req, res) => {
    try {
        const userId = req.params.userId
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        // Fetch user budget for the current month
        const budget = await Budget.findOne({ userId, month: currentMonth })

        if (!budget) {
            return res.status(404).json({ message: "No budget found for this month" })
        }

        const monthlyBudget = budget.amount

        // Fetch all expense transactions for the current month
        const expenses = await Transaction.find({
            userId,
            type: "expense",
            createdAt: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
            },
        });

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, transaction) => sum + transaction.amount, 0)

        // Update the budget document
        budget.spentAmount = totalExpenses;
        budget.remainingAmount = budget.amount - totalExpenses
        budget.status = totalExpenses > budget.amount ? "Exceeded" : "Active"
        await budget.save();

        // Prepare the response message
        let message = `Your total expense for this month is Rs${totalExpenses}.`
        if (totalExpenses > monthlyBudget) {
            message += ` You have exceeded your budget of Rs${monthlyBudget}!`
        }

        // Fetch past 3 months' transactions for recommendations
        const pastTransactions = await Transaction.find({
            userId,
            type: "expense",
            createdAt: { $gte: new Date(currentYear, currentMonth - 3, 1) },
        });

        //Analyze spending trends by category
        let categorySpend = {};
        pastTransactions.forEach((txn) => {
            if (!categorySpend[txn.category]) {
                categorySpend[txn.category] = { total: 0, count: 0 }
            }
            categorySpend[txn.category].total += txn.amount
            categorySpend[txn.category].count += 1
        });

        // Generate budget adjustment recommendations
        let recommendations = [];
        for (let category in categorySpend) {
            let avgSpending = categorySpend[category].total / categorySpend[category].count

            if (avgSpending > budget.amount * 0.3) {
                recommendations.push({
                    category,
                    suggestion: `Consider increasing your budget for ${category} as you often spend around Rs${avgSpending.toFixed(2)}.`,
                });
            } else if (avgSpending < budget.amount * 0.1) {
                recommendations.push({
                    category,
                    suggestion: `You can reduce your budget for ${category} since you usually spend only Rs${avgSpending.toFixed(2)}.`,
                });
            }
        }

        res.json({userId, monthlyBudget,
            totalExpenses,
            remainingAmount: budget.remainingAmount,
            budgetStatus: budget.status,
            message,
            recommendations: recommendations.length > 0 ? recommendations : ["Your budget is well-balanced."],
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = getUserMonthlyBudgetAndExpenses;



module.exports = {createBudget, getBudgets, deleteBudget, updateBudget, getBudgetsByUserId, getUserMonthlyBudgetAndExpenses}