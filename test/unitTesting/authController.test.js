const mongoose = require('mongoose')
const User = require('../../models/userModel')
const { signupUser, loginUser } = require('../../controllers/userController')
const request = require('supertest')
const express = require('express')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

app.post('/api/user/signup', signupUser)
app.post('/api/user/login', loginUser)

describe('Auth Controller - signupUser', () => {
    beforeAll(async () => {
        //Connect to a test database
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await User.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    // it('should create a new user and return a token', async () => {
    //     const response = await request(app)
    //         .post('/api/user/signup')
    //         .send({
    //             userId:'UI-859531',
    //             name: 'John Doe',
    //             email: "johondoe@example.com",
    //             password: 'Str0ng@Password123!',
    //             role: 'regular'
    //         })

    //     console.log(response.body)  

    //     expect(response.status).toBe(200)
    //     expect(response.body.message).toBe('Create Account successful!')
    //     expect(response.body.token).toBeDefined()
    //     expect(response.body.email).toBe('johondoe@example.com')
    // })

    it('should throw error if email is already in use', async () => {
        await User.create({
            userId:'UI-859531',
            name: 'John Doe',
            email: "johondoe@example.com",
            password: 'Str0ng@Password123!',
            role: 'regular'
        })

        const response = await request(app)
            .post('/api/user/signup')
            .send({
                userId:'UI-859531',
                name: 'John Doe',
                email: "johondoe@example.com",
                password: 'Str0ng@Password123!',
                role: 'regular'
            })

        console.log(response.body)  

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Email already in use')
    })

    it('should throw error if email or password is missing', async () => {
        const response = await request(app)
            .post('/api/user/signup')  
            .send({
                name: 'John Doe',
                email: '',
                password: '',
                role: 'regular'
            })

        console.log(response.body)  

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('All fields must be filled')
    })
})



describe('Auth Controller - loginUser', () => {

    beforeAll(async () => {
        //Connect to a test database
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://127.0.0.1/testdb')
    })

    afterEach(async () => {
        await User.deleteMany()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })


    // it('should login a user and return a token', async() => {
    //     await User.create({
    //         userId:'UI-859531',
    //         name: 'John Doe',
    //         email:'johondoe@example.com',
    //         password: await bcrypt.hash('Str0ng@Password123!', 10),
    //         role: 'regular'
    //     })

    //     const response = await request(app)
    //     .post('/api/user/login')  
    //     .send({
    //         email: 'johndoe@example.com',
    //         password: 'Str0ng@Password123!'
    //       })
         
    //       console.log('Response body:', response.body); 
          
    //       expect(response.status).toBe(200)
    //       expect(response.body.message).toBe('Regular user login successful!')
    //       expect(response.body.token).toBeDefined()
    //       expect(response.body.email).toBe('johndoe@example.com')
      
    // })

    it('should throw error if incorrect email is provided', async () => {
        const response = await request(app)
          .post('/api/user/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Str0ng@Password123!'
          })
    
        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Incorrect email')
      })



      it('should throw error if incorrect password is provided', async () => {
        await User.create({
          userId:'UI-859531',
          name: 'John Doe',
          email: 'johndoe@example.com',
          password: await bcrypt.hash('Str0ng@Password123!', 10),
          role: 'regular'
        })
    
        const response = await request(app)
          .post('/api/user/login') 
          .send({
            email: 'johndoe@example.com',
            password: 'WrongPassword123'
          })
    
        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Incorrect password')
      })
    

      it('should throw error if email or password is missing', async () => {
        const response = await request(app)
          .post('/api/user/login') 
          .send({
            email: '',
            password: ''
          })
    
        expect(response.status).toBe(400)
        expect(response.body.error).toBe('All fields must be filled')
      })
})