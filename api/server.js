const express = require('express');
const app = express();
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());
dotenv.config()

//connection to the database
const db = mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD
})

//test connection
db.connect((err)=> {
    //if connection doesnt work
    if(err) return console.log("error connecting to MySQL")
})

//connection work
console.log("connected to MySQL as id:", db.threadId);

//create a db
db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err,result)=> {
    //error creating db
    if (err) return consolr.log("error creating database")

    //if no error creating db
    console.log("db expense_tracker created/checked successfully");

    //select the expense_tracker db
    db.changeUser({ database: 'expense_tracker'}, (err, result) => {
        //if err changing db
        if (err) return console.log("error changing db")

        //if no err changing
        console.log("expense_tracker is in use");

        //create table
        const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100)NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL
        )
        `;

        db.query(createUsersTable, (err, result) => {
            //if error creating table
            if(err) return console.log("error creating table")

            //if no error creating table
            console.log("users table is created/checked successfully")
        })
    })
})


//user registration
app.post('/api/register', async(req, res)=> {
    try{
        const users = `SELECT* FROM users WHERE email = ?`
        db.query(users, [req.body.email],(err, data) => {
            //if email exists
            if(data.length > 0) return res.status(409).json("user already exists")

            //if no email exists
            //password hashing by bcrypt
            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            //create new user
            const newUser = `INSERT INTO users(email, username, password) VALUES (?)`
            value = [req.body.email, req.body.username, hashedPassword ]

            db.query(newUser, [value], (err, data) => {
                //if insert user fail
                if (err) return res.status(400).json("something went wrong")

                //insert user works
                res.status(200).json("user created successfully");            
        })
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error");}
})

//C R U D(create,retrieve,update,delete)

//user login
app.post('/api/login', async(req, res) => {
    try{
        const users = `SELECT*FROM users WHERE email = ?`
        db.query(users, [req.body.email], (err, data) => {
            //if user not found
            if(data.length === 0) return res.status(404).json("user not found");

            //if user exists
            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

            if(!isPasswordValid) return res.status(400).json("Invalid password or email")

            //if password and email match
            return res.status(201).json("login successful")
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error")
    }
})
// running the server
app.listen(3000, ()=> {
    console.log("server running on PORT 3000")
})