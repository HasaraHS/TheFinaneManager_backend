require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const userRoutes = require('./routes/user')
const TransactionRoutes = require('./routes/transaction')
const BudgetRoutes = require('./routes/budget')
const GoalRoutes = require('./routes/goal')
const ReportRoutes = require('./routes/report')

//express app
const app = express()

//middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

//routes
app.use('/api/user', userRoutes)
app.use('/api/transaction', TransactionRoutes)
app.use('/api/budget', BudgetRoutes)
app.use('/api/goal', GoalRoutes)
app.use('/api/report', ReportRoutes)

//connect to db
mongoose.connect(process.env.MONG_URI)
.then(() => {
   //listen for request
    app.listen(process.env.PORT, () => {
    console.log('connected to db & listening on port', process.env.PORT)
})
})
.catch((error) => {
    console.log(error)
})

