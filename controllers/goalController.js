const mongoose = require('mongoose')
const Goal = require('../models/goalModel')
const Transaction = require('../models/transactionModel')

//create goal
const createGoal = async (req,res) => {
    const {userId,title,amount,savedAmount,deadline,status,description} = req.body

        // Ensure transactionId is generated
        const goalId = `GI-${Math.floor(1000 + Math.random() * 900000)}`;
    
        //add to db
        try{
            const goal = await Goal.create({goalId,userId,title,amount,savedAmount,deadline,status,description})
            res.status(200).json(goal)
        } catch(error){
           res.status(400).json({error: error.message})
        }
}

//get all goals
const getGoals = async (req,res) => {
    try{
        const goals = await Goal.find({}).sort({createdAt: -1})
        res.status(200).json(goals)
    }catch (error){
        res.status(400).json({error: error.message})
    }
}

//get single goal (specific user)
const getGoalsByUserId = async (req,res) => {
    try{
        const {userId} = req.params
        const goals = await Goal.find({userId})
        res.status(200).json(goals)

    }catch (error){
        res.status(500).json({ error: "Internal Server Error", details: error.message })
    }
}

//delete goal
const deleteGoal = async (req,res) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error:"No such goal"})
        }
    
    const goal = await Goal.findOneAndDelete({_id : id})

    if(!goal){
        return res.status(404).json({error:"No such goal"})
    }

    res.status(200).json(goal)
}

//update goal
const updateGoal = async (req,res) => {
    const {id} = req.params
    
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:"No such goal"})
    }

    // Destructure allowed fields
    const { title,amount, savedAmount,deadline, description } = req.body

    let updateFields = {};

    if(title) updateFields.title = title
    if(amount) updateFields.amount = amount
    if(savedAmount) updateFields.savedAmount = savedAmount
    if(deadline) updateFields.deadline = deadline
    if(description) updateFields.description = description

    try {
            const goal = await Goal.findOneAndUpdate(
                { _id: id }, 
                { $set: updateFields }, 
                { new: true, runValidators: true }
            )

            if(!goal){
                return res.status(404).json({error:"No such goal"})
            }
        
            res.status(200).json(goal)
        } catch (error){
            res.status(500).json({ error: "Internal Server Error", details: error.message })
        }
}


const allocateIncomeToGoals = async (req, res) => {
    try {
        const userId = req.params.userId;
        const allocationPercentage = 10;
        let updatedGoals = []; // Store updated goal details
        let updatedTransactions = []; // Store updated transaction details

        // Fetch all income transactions for this user
        const incomeTransactions = await Transaction.find({ userId, type: "income" });

        if (incomeTransactions.length === 0) {
            return res.status(404).json({ message: "No income transactions found for this user." });
        }

        // Fetch all goals of the user
        const userGoals = await Goal.find({ userId });

        if (userGoals.length === 0) {
            return res.status(404).json({ message: "No active goals found for this user." });
        }

        let totalAllocated = 0; // Track total allocated amount

        for (let transaction of incomeTransactions) {
            let amountToSave = (transaction.amount * allocationPercentage) / 100;
            totalAllocated += amountToSave;

            // Deduct the allocated amount from transaction
            transaction.amount -= amountToSave;
            await transaction.save(); // Save updated transaction amount

            updatedTransactions.push({
                transactionId: transaction.transactionId,
                updatedAmount: transaction.amount,
                originalAmount: transaction.amount + amountToSave,
            });

            // Distribute savings to user's goals
            for (let goal of userGoals) {
                goal.savedAmount += amountToSave;
                await goal.save();

                updatedGoals.push({
                    goalId: goal.goalId,
                    title: goal.title,
                    totalAmount: goal.amount,
                    savedAmount: goal.savedAmount,
                    deadline: goal.deadline,
                    status: goal.status,
                });
            }
        }

        res.json({
            message: `Successfully allocated ${allocationPercentage}% of income (${totalAllocated}) to user's goals.`,
            totalAllocated,
            updatedGoals,
            updatedTransactions,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



module.exports = allocateIncomeToGoals;



module.exports = {createGoal, getGoals, getGoalsByUserId, deleteGoal, updateGoal, allocateIncomeToGoals}