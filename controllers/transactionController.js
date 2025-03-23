require('dotenv').config()
const mongoose = require('mongoose')
const Transaction = require('../models/transactionModel')

//create transaction
const createTransaction = async(req, res) => {
    const {type,category,label,amount,userId,currency,recurringType,description } = req.body
    
    // Ensure transactionId is generated
    const transactionId = `TI-${Math.floor(1000 + Math.random() * 900000)}`;

    //add to db
    try{
        const transaction = await Transaction.create({transactionId,type,category,label,amount,userId,currency,recurringType,description})
        res.status(200).json(transaction)
    }catch (error){
        res.status(400).json({error: error.message})
    }
}


//delete transaction
const deleteTransaction = async (req, res) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error:"No such transaction"})
    }

    const transaction = await Transaction.findOneAndDelete({_id: id})

    if(!transaction){
        return res.status(404).json({error:"No such transaction"})
    }

    res.status(200).json(transaction)

}

//update transaction
const updateTransaction = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such transaction" });
    }

    // Destructure allowed fields
    const { type, category, label, amount, recurringType, description } = req.body;

    let updateFields = {};

    if (type) updateFields.type = type;
    if (category) updateFields.category = category;
    if (label) updateFields.label = label;
    if (amount) updateFields.amount = amount;
    if (recurringType) updateFields.recurringType = recurringType;
    if (description) updateFields.description = description;

    try {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: id }, 
            { $set: updateFields }, 
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ error: "No such transaction" })
        }

        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message })
    }
}



//get all transactions (admin)
const getTransactions = async (req, res) => {
    const transactions = await Transaction.find({}).sort({createdAt: -1})

    res.status(200).json(transactions)
}


// Get transactions for a specific user
const getTransactionsByUserId =  async (req, res) => {
    try {
        const { userId } = req.params
        const transactions = await Transaction.find({ userId })
        res.status(200).json(transactions)
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message })

    }
}

//get transactions specific user and filter that user transaction using label
const getTransactionByLable = async (req, res) =>  {
    try{
        const {userId} = req.params
        const {label} = req.params

        const transactions = await Transaction.find({userId, label})
        
        if(!transactions){
                return res.status(404).json({ error: "No such transaction" })
        }
        
        res.status(200).json(transactions)
    } catch(error){
        res.status(500).json({ error: "Internal Server Error", details: error.message })
    }
    
}

//get transactions  filter that user transaction using  recurringType and send notification
const getTransactionsByReurringType = async (req, res) => {
    try {
        const {id} = req.params

        const transaction = await Transaction.findById(id)
        if(!transaction){
            return res.status(404).json({ error: "No such transaction" })
    }
        //get created date
         const createdAt = new Date(transaction.createdAt);

         //get current date
         const currentDate = new Date()

         //get due date
         const dueDate = new Date(createdAt);
         
         //set reminder date
         const reminderDate = new Date(dueDate)
         let notifications = [];

         if(transaction.recurringType === "monthly"){
            
            //set due date to after month
            dueDate.setMonth(dueDate.getMonth() + 1)

           //set reminder date (two days before due date)
           reminderDate.setDate(reminderDate.getDate() -2)
           
           //notify if it's reminder date, due day
           if( currentDate.toDateString() === reminderDate.toDateString()){
            notifications.push(transaction.userId, `Reminder: Your ${transaction.category} payment of ${transaction.amount} is due in 2 days.`)
           } else if(currentDate.toDateString() === dueDate.toDateString()){
            sendNotification(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is due today.`)
           } else {
            notifications.push(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is not due yet.`)
           }
         } else if(transaction.recurringType === "weekly"){
            
            //set due date after week
            dueDate.setDate(dueDate.getDate() + 7)
            //set reminder date (one day before due date)
            reminderDate.setDate(reminderDate.getDate() - 1)

            //notify reminder date, due date
            if(currentDate.toDateString() === reminderDate.toDateString()){
                notifications.push(transaction.userId, `Reminder: Your ${transaction.category} payment of ${transaction.amount} is due in 1 day.`)
            }else if(currentDate.toDateString() === dueDate.toDateString()){
                sendNotification(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is due today.`)
            }else {
                notifications.push(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is not due yet.`)
            }

         } else if (transaction.recurringType === "daily") {
            // Set due date 24 hours after creation
            dueDate.setDate(dueDate.getDate() + 1);
        
            // Set reminder 2 hours before due date
            reminderDate.setHours(dueDate.getHours() - 2);
        
            // Get current time
            const currentTime = currentDate.getTime();
            const reminderTime = reminderDate.getTime();
            const dueTime = dueDate.getTime();
        
            if (currentTime >= reminderTime && currentTime < dueTime) {
                notifications.push(`Reminder: Your ${transaction.category} payment of ${transaction.amount} is due in less than 2 hours.`);
            } 
            else if (currentTime >= dueTime) {
                notifications.push(`Payment Due: Your ${transaction.category} payment of ${transaction.amount} is due now.`);
            } 
            else {
                notifications.push(`Payment Due: Your ${transaction.category} payment of ${transaction.amount} is not due yet.`);
            }
        }else if(transaction.recurringType === "annually") {
            // Set due date to 1 year after creation
            dueDate.setFullYear(dueDate.getFullYear() + 1);
        
            // Set reminder date (7 days before due date)
            reminderDate.setDate(dueDate.getDate() - 7);
        
            // Check the current date against reminder and due date
            if (currentDate.toDateString() === reminderDate.toDateString()) {
                notifications.push(transaction.userId, `Reminder: Your ${transaction.category} payment of ${transaction.amount} is due in 7 days.`);
            } 
            else if (currentDate.toDateString() === dueDate.toDateString()) {
                sendNotification(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is due today.`);
            } 
            else {
                notifications.push(transaction.userId, `Payment Due: Your ${transaction.category} payment of ${transaction.amount} is not due yet.`);
            }
        }        


         // Send all notifications without interfering with response
        notifications.forEach((msg) => sendNotification(transaction.userId, msg));

        res.status(200).json({  transaction, reminderDate,dueDate,notifications})

    } catch (error){
        res.status(500).json({ error: "Internal Server Error", details: error.message })
    
    }
}

// Function to simulate sending a notification
const sendNotification = async(userId, message) => {
    console.log(`Notification sent to user ${userId}: ${message}`);
};


//function to get exchange range 
const getExchangeRate = async (fromCurrency, toCurrency) => {
    const apiKey = process.env.APIKEY
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`

    try{
        const response = await fetch(url)
        const data = await response.json()
        return data.rates[toCurrency] || null

    } catch(error){
        console.error('Error fetching exchange rate ', error )
        return null
    }
}

//function to convert transaction amount
const converTransaction = async (req, res) => {
    try{
        const {transactionId, toCurrency} = req.params
        const transaction = await Transaction.findById(transactionId)

        if(!transaction){
            return res.status(404).json({ error: "No such transaction" })
        }

        if(transaction === toCurrency){
            return res.json({amount: transaction.amount, currency: toCurrency, transaction})
        }

        const rate = await getExchangeRate(transaction.currency, toCurrency)

        if (!rate) {
            return res.status(400).json({ message: 'Exchange rate not available' });
        }

        const convertedAmount = transaction.amount * rate;
        res.json({ amount: convertedAmount.toFixed(2), currency: toCurrency , transaction})
       
    } catch (error){
        console.error('Server error:', error)
        res.status(500).json({ message: 'Server error', error })
    }
}


module.exports = {
    createTransaction, deleteTransaction, updateTransaction, getTransactions,
    getTransactionsByUserId,getTransactionByLable,getTransactionsByReurringType,converTransaction
}



