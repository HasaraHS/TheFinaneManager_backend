const express = require('express')
const router = express.Router()
const {generateUserReport, getReports} = require('../controllers/reportController')

//create report
router.post('/' , generateUserReport)

//get all the reports 
router.get('/' ,getReports)




module.exports = router