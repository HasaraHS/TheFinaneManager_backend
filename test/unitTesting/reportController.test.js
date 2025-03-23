const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const Report = require('../../models/reportModel');
const Transaction = require('../../models/transactionModel');
const Budget = require('../../models/budgetModel');
const { generateUserReport, getReports } = require('../../controllers/reportController');

const app = express();
app.use(express.json());

app.post('/api/report', generateUserReport);
app.get('/api/report', getReports);

// Connect to test database before running tests
beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
    await Report.deleteMany();
    await Transaction.deleteMany();
    await Budget.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Create Report
describe('Report Controller - generateUserReport', () => {
    it('should return an error if startDate or endDate is missing', async () => {
        const response = await request(app).post('/api/report').send({
            userId: 'UI-234567'
        });

        console.log('Missing startDate or endDate response:', response.body);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Start date and end date are required.");
    });

    it('should return an error for invalid date format', async () => {
        const response = await request(app).post('/api/report').send({
            userId: 'UI-234567',
            startDate: 'invalid-date',
            endDate: 'invalid-date'
        });

        console.log('Invalid date format response:', response.body);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid date format.");
    });

    it('should return 404 if no transactions exist', async () => {
        const response = await request(app).post('/api/report').send({
            userId: 'UI-234567',
            startDate: '2023-01-01',
            endDate: '2023-03-01',
            category: 'Food' 
        });

        console.log('No transactions found response:', response.body);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("No transactions found in this period.");
    });

    // it('should generate a report with transactions and budget data', async () => {
    //     await Transaction.insertMany([
    //         { transactionId:'TI-1001', userId: 'UI-234567', type: 'income', amount: 5000, category: 'Food', label: 'Monthly Salary' ,createdAt: new Date('2023-01-10') },
    //         { transactionId:'TI-1002',userId: 'UI-234567', type: 'expense', amount: 1000, category: 'Food', label: 'food' ,createdAt: new Date('2023-01-15') },
    //         { transactionId:'TI-1003',userId: 'UI-234567', type: 'expense', amount: 500, category: 'Food',label: 'transport', createdAt: new Date('2023-01-20') }
    //     ]);

    //     await Budget.create({ budgetId:'BI-1001',userId: 'UI-234567', amount: 4000, remainingAmount: 2500,month:1, createdAt: new Date('2023-01-01') });

    //     const response = await request(app).post('/api/report').send({
    //         userId: 'UI-234567',
    //         startDate: '2023-01-01',
    //         endDate: '2023-03-01',
    //         category: 'Food' 
    //     });

    //     console.log('Generate report response:', response.body);

    //     expect(response.status).toBe(200);
    //     expect(response.body.message).toBe("Financial report generated successfully.");
    //     expect(response.body.report.totalIncome).toBe(5000);
    //     expect(response.body.report.totalExpenses).toBe(1500);
    //     expect(response.body.report.savings).toBe(3500);
    //     expect(response.body.report.categoryExpenses.Food).toBe(1500);
    //     expect(response.body.report.budgetAllocated).toBe(4000);
    //     expect(response.body.report.budgetRemaining).toBe(2500);
    // });
});

// Get All Reports
describe('Report Controller - getReports', () => {
    it('should return all reports', async () => {
        await Report.create({
            reportId: 'RI-123456',
            userId: 'UI-12345',
            totalIncome: 5000,
            totalExpenses: 1500,
            savings: 3500,
            categoryExpenses: { Food: 1000, Transport: 500 },
            budgetAllocated: 4000,
            budgetRemaining: 2500,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31'),
            recommendations: "You're doing well!"
        });

        const response = await request(app).get('/api/report');

        console.log('Get all reports response:', response.body);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].totalIncome).toBe(5000);
    });

    it('should return an empty array if no reports exist', async () => {
        const response = await request(app).get('/api/report');

        console.log('Get all reports with no data response:', response.body);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });
});
