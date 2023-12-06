var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.use(cors())

const mysql = require('mysql2');

const connection = mysql.createConnection({
   
    host: 'localhost',
    user: 'root',
    database: 'dtctest'
});
// Register-------------------------------------------------------------------------------------------------------------------
app.post('/register', jsonParser, function (req, res, next) {
    if (!req.body.user_username || !req.body.user_password ) {
        return res.json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    else{
    bcrypt.hash(req.body.user_password, saltRounds, function (err, hash) {  
        console.log('Request Body:', req.body);
       
        connection.execute(
            'INSERT INTO users (user_username, user_password, user_fname, user_lname, user_citizenid, user_phone) VALUES (?, ?, ?, ?, ?, ?)',
            [req.body.user_username, hash, req.body.user_fname, req.body.user_lname, req.body.user_citizenid, req.body.user_phone],
            function (err, results, fields) {
                if (err) {
                    return res.json({ status: 'error', message: err });
                }
                return res.json({ status: 'ok' });
            }
        );
    })};
});

// Register----------------------------------------------------------------------------------------------------------------

// Login-------------------------------------------------------------------------------------------------------------------
app.post('/login', jsonParser, function (req, res, next) {
    connection.execute(
        'SELECT * FROM users WHERE user_username=?',
        [req.body.user_username],
        function (err, users, fields) {
            if (err) {
                res.json({ status: 'error', message: err })
                return
            }
            if (users.length == 0) {
                res.json({ status: 'error', message: 'no user found' })
                return
            }else{
            const userId = users[0].user_id;
            bcrypt.compare(req.body.user_password, users[0].user_password, function (err, isLogin) {
                if (isLogin) {
                    res.json({ status: 'ok', message: 'login success'})

                }
                else {
                    res.json({ status: 'error', message: isLogin })
                }
            });
        }
        }
    )
})
// Login-------------------------------------------------------------------------------------------------------------------
app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333')
})
