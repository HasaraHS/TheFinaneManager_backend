const mongoose = require('mongoose')
const request = require('supertest')
const express = require('express')
const Goal = require('../../models/goalModel')
const Transaction = require('../../models/transactionModel')
const {createGoal, getGoals, getGoalsByUserId, deleteGoal, updateGoal, allocateIncomeToGoals } = require('../../controllers/goalController');

const app = express()
app.use(express.json())

app.post('/api/goal', createGoal)
app.get('/api/goal', getGoals)
app.get('/api/goal/user/:userId', getGoalsByUserId)
app.delete('/api/goal/:id', deleteGoal)
app.patch('/api/goal/:id', updateGoal)
app.put('/api/goal/income/:userId', allocateIncomeToGoals)

// Connect to test database before running tests
beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
});

afterEach(async () => {
    await Goal.deleteMany()
    await Transaction.deleteMany()
});

afterAll(async () => {
    await mongoose.connection.close()
});

// Create Goal
describe('Goal Controller - createGoal', () => {
    it('should create a new goal and return the goal details', async () => {
        const response = await request(app)
            .post('/api/goal')
            .send({
                userId: 'UI-12345',
                title: 'New Car',
                amount: 10000,
                savedAmount: 2000,
                deadline: '2025-12-31',
                status: 'In Progress',
                description: 'Saving for a new car'
            });

        console.log('Create new goal response:', response.body)

        expect(response.status).toBe(200)
        expect(response.body.goalId).toMatch(/^GI-\d+$/)
        expect(response.body.amount).toBe(10000)
        expect(response.body.savedAmount).toBe(2000)
        expect(response.body.status).toBe('In Progress')
    });
});

// Get Goals for Specific User
describe('Goal Controller - getGoalsByUserId', () => {
    it('should return all goals for a specific user', async () => {
        await Goal.create({
            goalId: 'GI-123456',
            userId: 'UI-12345',
            title: 'New House',
            amount: 50000,
            savedAmount: 5000,
            deadline: '2026-06-30',
            status: 'In Progress',
            description: 'Saving for a house'
        });

        const response = await request(app).get('/api/goal/user/UI-12345')

        console.log('Get goals for a specific user response:', response.body)

        expect(response.status).toBe(200)
        expect(response.body[0].userId).toBe('UI-12345')
        expect(response.body[0].title).toBe('New House')
    });
});

// Update Goal
describe('Goal Controller - updateGoal', () => {
    it('should update a goal and return the updated details', async () => {
        const goal = await Goal.create({
            goalId: 'GI-789012',
            userId: 'UI-6789',
            title: 'Vacation',
            amount: 3000,
            savedAmount: 500,
            deadline: '2025-08-01',
            status: 'In Progress',
            description: 'Saving for a vacation'
        });

        const response = await request(app)
            .patch(`/api/goal/${goal._id}`)
            .send({ savedAmount: 1000 })

        console.log('Update goal response:', response.body)

        expect(response.status).toBe(200)
        expect(response.body.savedAmount).toBe(1000)
    });

    it('should return an error if goal does not exist', async () => {
        const response = await request(app)
            .patch('/api/goal/605c72bcf1d2f2c16c002b1f')
            .send({ amount: 7000 })

        console.log(response.body)

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('No such goal')
    })
})

// Delete Goal
describe('Goal Controller - deleteGoal', () => {
    it('should delete a goal and return deleted goal details', async () => {
        const goal = await Goal.create({
            goalId: 'GI-123123',
            userId: 'UI-7890',
            title: 'Guitar',
            amount: 1000,
            savedAmount: 200,
            deadline: '2024-09-01',
            status: 'In Progress',
            description: 'Saving for a guitar'
        });

        const response = await request(app).delete(`/api/goal/${goal._id}`)

        console.log('Delete goal response:', response.body)

        expect(response.status).toBe(200)
        expect(response.body.goalId).toBe('GI-123123')
    })
})

// Allocate Income to Goals
describe('Goal Controller - allocateIncomeToGoals', () => {
    // it('should allocate income to user goals and return updated details', async () => {
    //     await Transaction.create({
    //         transactionId: 'TI-1001',
    //         userId: 'UI-123459',
    //         amount: 2000,
    //         type: 'income',
    //         label: 'Salary',  
    //         category: 'Salary' 
    //     });

    //     await Goal.create({
    //         goalId: 'GI-5678',
    //         userId: 'UI-123459',
    //         title: 'Emergency Fund',
    //         amount: 5000,
    //         savedAmount: 500,
    //         deadline: '2025-12-31',
    //         status: 'In Progress',
    //         description: 'Building an emergency fund'
    //     })

    //     const response = await request(app).put('/api/goal/income/UI-123459')

    //     console.log('Allocate income to goals response:', response.body)

    //     expect(response.status).toBe(200)
    //     expect(response.body.totalAllocated).toBeGreaterThan(0)
    //     expect(response.body.updatedGoals.length).toBeGreaterThan(0)
    //     expect(response.body.updatedTransactions.length).toBeGreaterThan(0)
    // })
   
})
