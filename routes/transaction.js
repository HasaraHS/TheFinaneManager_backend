const express = require('express')
const router = express.Router()

//controller function
const {createTransaction, deleteTransaction, updateTransaction, getTransactions ,getTransactionsByUserId,getTransactionByLable,
    getTransactionsByReurringType, converTransaction
} =require('../controllers/transactionController')

//create new transaction
router.post('/', createTransaction)

//delete transaction
router.delete('/:id', deleteTransaction)

//update transaction
router.patch('/:id', updateTransaction)

//get all transactions (admin)
router.get('/', getTransactions)

//get transaction and notify recurring notify
router.get('/:id', getTransactionsByReurringType)

//get specific user details using userId
router.get('/user/:userId', getTransactionsByUserId)

//get specific user details using userId and fliter using label
router.get('/:userId/:label', getTransactionByLable)

//covert currency
router.get('/convert/:transactionId/:toCurrency', converTransaction);



module.exports = router