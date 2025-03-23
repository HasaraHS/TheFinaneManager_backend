const express = require('express')
const router = express.Router()

const {createGoal, getGoals, getGoalsByUserId, deleteGoal, updateGoal, allocateIncomeToGoals} = require('../controllers/goalController')

//create new goal
router.post('/', createGoal)

//get all goals
router.get('/', getGoals)

//get goals foe sepecific user
router.get('/user/:userId', getGoalsByUserId)

//delete goal
router.delete('/:id', deleteGoal)

//update goal
router.patch('/:id', updateGoal)

//allocate income to user's goals
router.put("/income/:userId", allocateIncomeToGoals);

module.exports = router