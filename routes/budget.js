const express = require('express')
const router = express.Router()

const{createBudget, getBudgets, deleteBudget, updateBudget, getBudgetsByUserId, getUserMonthlyBudgetAndExpenses} = require ('../controllers/budgetController')

//create new budget
router.post('/', createBudget)

//get all budgets
router.get('/', getBudgets)

//delete budget
router.delete('/:id', deleteBudget)

//update budget 
router.patch('/:id', updateBudget)

//get specific user budgets using userId
router.get('/user/:userId', getBudgetsByUserId)

// Route to get user monthly budget and expenses
router.get("/budget/:userId", getUserMonthlyBudgetAndExpenses)

module.exports = router