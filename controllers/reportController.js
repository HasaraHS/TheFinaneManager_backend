const Report = require('../models/reportModel');
const Transaction = require('../models/transactionModel');
const Budget = require('../models/budgetModel');

const generateUserReport = async (req, res) => {
    try {
        const { userId, startDate, endDate, category, label } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date format
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format." })
        }

        // Build query object dynamically
        let query = {
            userId,
            createdAt: { $gte: start, $lte: end }
        };

        if (category) {
            query.category = category;
        }

        if (label) {
            query.label = label;
        }

        // Fetch transactions for the given user and date range
        const transactions = await Transaction.find(query);

        if (transactions.length === 0) {
            return res.status(404).json({ message: "No transactions found in this period." })
        }

        let totalIncome = 0;
        let totalExpenses = 0;
        let categoryExpenses = new Map();

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += transaction.amount;
                categoryExpenses.set(transaction.category, (categoryExpenses.get(transaction.category) || 0) + transaction.amount);
            }
        });

        // Convert categoryExpenses Map to a plain object
        const categoryExpensesObject = Object.fromEntries(categoryExpenses);

        // Fetch the latest budget for the user (if available)
        const budget = await Budget.findOne({ userId }).sort({ createdAt: -1 });

        const budgetAllocated = budget ? budget.amount : 0;
        const budgetRemaining = budget ? budget.remainingAmount : 0;
        const savings = totalIncome - totalExpenses;

        // Generate recommendations based on spending trends
        let recommendations = "You're doing well!";
        if (totalExpenses > totalIncome) {
            recommendations = "Your expenses are higher than your income. Consider reducing discretionary spending.";
        } else if (budget && totalExpenses > budget.amount) {
            recommendations = "You have exceeded your budget. Try adjusting your spending habits.";
        }

        // Create the report
        const report = new Report({
            reportId: `RI-${Math.floor(1000 + Math.random() * 900000)}`,
            userId,
            totalIncome,
            totalExpenses,
            savings,
            categoryExpenses: categoryExpensesObject,
            budgetAllocated,
            budgetRemaining,
            startDate: start,
            endDate: end,
            recommendations
        });

        await report.save();

        res.json({
            message: "Financial report generated successfully.",
            report
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}


//get all reports
const getReports = async (req,res) => {
    try{
        const reports = await Report.find({}).sort({createdAt: -1})
        res.status(200).json(reports)
    }catch (error){
        res.status(400).json({error: error.message})
    }
}

module.exports = { generateUserReport , getReports};
