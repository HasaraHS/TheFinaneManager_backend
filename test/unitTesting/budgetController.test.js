const mongoose = require('mongoose')
const request = require('supertest')
const express = require('express')
const Budget = require('../../models/budgetModel')
const { createBudget, getBudgets, deleteBudget, updateBudget, getBudgetsByUserId, getUserMonthlyBudgetAndExpenses } = require('../../controllers/budgetController')

const app = express()
app.use(express.json())

app.post('/api/budget', createBudget)
app.get('/api/budget', getBudgets)
app.delete('/api/budget/:id', deleteBudget)
app.patch('/api/budget/:id', updateBudget)
app.get('/api/budget/user/:userId', getBudgetsByUserId)
app.get('/api/budget/budget/:userId', getUserMonthlyBudgetAndExpenses)


// Connect to the test database before running tests
beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
})

afterEach(async () => {
    await Budget.deleteMany()
})

afterAll(async () => {
    await mongoose.connection.close()
})

//create budget
describe('Budget Controller - createBudget', () => {
    it('should create a new budget and return the budget details', async () => {
        const response = await request(app)
            .post('/api/budget')
            .send({
                userId: 'UI-12345',
                month: 3,
                amount: 5000,
                spentAmount: 1000,
                remainingAmount: 4000,
                status: 'Active'
            })

            console.log('create new budget response', response.body)

            expect(response.status).toBe(200)
            expect(response.body.budgetId).toMatch(/^BI-\d+$/)
            expect(response.body.amount).toBe(5000)
            expect(response.body.spentAmount).toBe(1000)
            expect(response.body.remainingAmount).toBe(4000)
            expect(response.body.status).toBe('Active')
 })
})

//get all budgets for specific user
describe('Budget Controller - getBudgetsByUserId', () => {
    it('should return all budgets for a specific user', async () => {
        await Budget.create({
            budgetId: 'BI-123456',
            userId: 'UI-12345',
            month: 3,
            amount: 5000,
            spentAmount: 1000,
            remainingAmount: 4000,
            status: 'Active'
        })

        const response = await request(app)
            .get('/api/budget/user/UI-12345')

        console.log('get budgets for a specific user response', response.body)

        expect(response.status).toBe(200)
        expect(response.body[0].userId).toBe('UI-12345')
    })
})

//update budget
describe('Budget Controller - updateBudget', () => {
    it('should update a budget and return the updated budget', async () => {
        const newBudget = await Budget.create({
            budgetId: 'BI-123456',
            userId: 'UI-123',
            month: 3,
            amount: 5000,
            spentAmount: 2000,
            remainingAmount: 3000,
            status: 'Active'
        })

        const response = await request(app)
            .patch(`/api/budget/${newBudget._id}`)
            .send({
                spentAmount: 2500
            })

        console.log('update budget response', response.body)

        expect(response.status).toBe(200)
        expect(response.body.spentAmount).toBe(2500)
        expect(response.body.remainingAmount).toBe(2500)
    })

    it('should return error if budget does not exist', async () => {
        const response = await request(app)
            .patch('/api/budget/605c72bcf1d2f2c16c002b1f')
            .send({
                amount: 6000
            })

        console.log(response.body)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No such budget entry')
    })
})

//delete budget
describe('Budget Controller - deleteBudget', () => {
    it('should delete a budget and return the deleted budget details', async () => {
        const budget = await Budget.create({
            budgetId: 'BI-123456',
            userId: 'UI-123',
            month: 3,
            amount: 5000,
            spentAmount: 1000,
            remainingAmount: 4000,
            status: 'Active'
        })

        const response = await request(app)
            .delete(`/api/budget/${budget._id}`)

        console.log("delete budget response", response.body)

        expect(response.status).toBe(200)
        expect(response.body.budgetId).toBe('BI-123456')
    })

    it('should return error if budget does not exist', async () => {
        const response = await request(app)
            .delete('/api/budget/605c72bcf1d2f2c16c002b1f')

        console.log(response.body)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No such budget entry')
    })
})

//get monthly expenses and check it is exeed or not budget
describe('Budget Controller - getUserMonthlyBudgetAndExpenses', () => {
    // it('should return user budget and expenses for the month', async () => {
    //     await Budget.create({
    //         budgetId: 'BI-123456',
    //         userId: 'UI-123457',
    //         month: new Date().getMonth() + 1,
    //         amount: 5000,
    //         spentAmount: 2000,
    //         remainingAmount: 3000,
    //         status: 'Active'
    //     })

    //     const response = await request(app)
    //         .get(`/api/budget/budget/UI-123456`)

    //     console.log('get user monthly budget and expenses response', response.body)

    //     expect(response.status).toBe(200)
    //     expect(response.body.userId).toBe('UI-123457')
    //     expect(response.body.totalExpenses).toBeDefined()
    //     expect(response.body.remainingAmount).toBeDefined()
    //     expect(response.body.budgetStatus).toBeDefined()
    // })
})