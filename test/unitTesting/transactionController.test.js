const mongoose = require('mongoose')
const { createTransaction, updateTransaction, deleteTransaction, getTransactions, getTransactionsByUserId, getTransactionByLable, getTransactionsByReurringType, converTransaction } = require('../../controllers/transactionController')
const Transaction = require('../../models/transactionModel')
const request = require('supertest')
const express = require('express')

const app = express()
app.use(express.json())

app.post('/api/transaction', createTransaction)
app.patch('/api/transaction/:id', updateTransaction)
app.delete('/api/transaction/:id', deleteTransaction)
app.get('/api/transaction', getTransactions)
app.get('/api/transaction/user/:userId', getTransactionsByUserId)
app.get('/api/transaction/:userId/:label', getTransactionByLable)
app.get('/api/transaction/:id', getTransactionsByReurringType)
app.get('/api/transaction/convert/:transactionId/:toCurrency', converTransaction)

//create
describe('Transaction Controller - createTransaction', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')   
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })


    it('should create a new transaction and return the transaction details', async () => {
        const response = await request(app)
            .post('/api/transaction')
            .send({
                type: 'income',
                category: 'salary',
                label: 'March Salary',
                amount: 1000,
                userId: 'UI-12345',
                currency: 'USD',
                recurringType: 'monthly',
                description: 'Monthly Salary'
            })

        console.log('create new transaction response',response.body)

        expect(response.status).toBe(200)
        expect(response.body.transactionId).toMatch(/^TI-\d+$/)
        expect(response.body.amount).toBe(1000)
        expect(response.body.type).toBe('income')
        expect(response.body.currency).toBe('USD')
    })

})


//update
describe('Transaction Controller - updateTransaction', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should update a transaction and return the updated transaction', async () => {
        const newTransaction = await Transaction.create({
            transactionId: 'TI-123456',
            type: 'income',
            category: 'salary',
            label: 'March Salary',
            amount: 1000,
            userId: 'UI-123',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
            .patch(`/api/transaction/${newTransaction._id}`)
            .send({
                amount: 1500
            })

        console.log('update transaction response',response.body)

        expect(response.status).toBe(200)
        expect(response.body.amount).toBe(1500)
    })


    it('should return error if transaction does not exist', async () => {
        const response = await request(app)
            .patch('/api/transaction/:id')
            .send({
                amount: 1500
            })

        console.log(response.body)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No such transaction')
    })

})

//delete
describe('Transaction Controller - deleteTransaction', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should delete a transaction and return the deleted transaction details', async () => {
        const transaction = await Transaction.create({
            transactionId: 'TI-123456',
            type: 'income',
            category: 'salary',
            label: 'March Salary',
            amount: 1000,
            userId: 'UI-123',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
            .delete(`/api/transaction/${transaction._id}`)

        console.log("delete transaction response",response.body)

        expect(response.status).toBe(200)
        expect(response.body.transactionId).toBe('TI-123456')
    })

    it('should return error if transaction does not exist', async () => {
        const response = await request(app)
            .delete('/api/transaction/:id')

        console.log(response.body)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No such transaction')
    })
})

//get all transactions
describe('Transaction Controller - getTransactions', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should return a list of all transactions', async () => {
        await Transaction.create({
            transactionId: 'TI-123456',
            type: 'income',
            category: 'salary',
            label: 'March Salary',
            amount: 1000,
            userId: 'UI-123',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
            .get('/api/transaction')

        console.log("return all transactions response",response.body )

        expect(response.status).toBe(200)
        expect(response.body.length).toBeGreaterThan(0)
    })
})

//get transaction and set notify according to reurringType
describe('transactionController - getTransactionsByReurringType', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should return transaction for user by recurringType and notify', async () => {
        const transaction = await Transaction.create({
            transactionId: 'TI-123456',
            type: 'income',
            category: 'salary',
            label: 'March Salary',
            amount: 1000,
            userId: 'UI-12345',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary',
            createdAt: new Date(new Date().setDate(new Date().getDate() - 30)) // Set to 30 days ago
        });

        expect(transaction).toBeDefined();
        expect(transaction._id).toBeDefined();
    
        // Use `transaction._id`
        const response = await request(app)
            .get(`/api/transaction/${transaction._id}`);
    
        console.log("Response body:", response.body);
    
        expect(response.status).toBe(200);
        expect(response.body.transaction).toHaveProperty('recurringType', 'monthly');
        expect(response.body.notifications.length).toBeGreaterThan(0);
        expect(response.body.transaction.userId).toBe('UI-12345');
    });
    
})

//get transaction By userId
describe('transactionController - getTransactionsByUserId', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
        })   

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should return transaction for a specific user', async () => {
        await Transaction.create({
            transactionId:'TI-123456',
            type:'income',
            category:'salary',
            label:'March Salary',
            amount: 1000,
            userId: 'UI-12345',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
            .get('/api/transaction/user/UI-12345')

        console.log('get transaction of specific user ', response.body)

        expect(response.status).toBe(200)
        expect(response.body[0].userId).toBe('UI-12345')
    })
})

//get transaction of user by filtering label
describe('transactionController - getTransactionByLable', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should return transaction for user by filtering label', async () => {
        await Transaction.create({
            transactionId:'TI-123456',
            type:'income',
            category:'salary',
            label:'March Salary',
            amount: 1000,
            userId: 'UI-12345',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
        .get('/api/transaction/UI-12345/March Salary')

         console.log('get transactions of a user by filtering label response ', response.body)

        expect(response.status).toBe(200)
        expect(response.body[0].userId).toBe('UI-12345')
        expect(response.body[0].label).toBe('March Salary')
})
})

//conert transaction currency
describe('transactionController - converTransaction', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
        })   

    afterEach(async () => {
        await Transaction.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    it('should return transaction converted currency and transaction', async () => {
        const transaction = await Transaction.create({
            transactionId:'TI-123456',
            type:'income',
            category:'salary',
            label:'March Salary',
            amount: 1000,
            userId: 'UI-12345',
            currency: 'USD',
            recurringType: 'monthly',
            description: 'Monthly Salary'
        })

        const response = await request(app)
            .get(`/api/transaction/convert/${transaction._id}/EUR`)

        console.log('get transaction with currency change response ', response.body)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('amount');
        expect(response.body).toHaveProperty('currency', 'EUR');
    })
})



