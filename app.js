var express = require('express')
var cors = require('cors')
var app = express()
const multer = require('multer');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var jwt = require('jsonwebtoken');
const secret = 'Fullstack-Login-2021'
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

app.use(express.json({ limit: '10mb' }));

const mysql = require('mysql2');

const connection = mysql.createConnection({
   
    host: 'localhost',
    user: 'root',
    database: 'dtctest'
});
// upload------------------------------------------------------------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'D:/SDC-nodejs/uploads');
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });
let uploadedImageBase64 = '';
 app.post('/upload', upload.single('image'), (req, res) => {
    
    try {
        console.log('inside upload!!!');
      console.log(req.body)
      const base64Image = req.body.image;
      uploadedImageBase64 = base64Image;
      console.log('Base64 Image:', uploadedImageBase64);
      res.status(200).send('Base64 Image uploaded successfully!');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  // upload------------------------------------------------------------------------------------------------------------------
  // Register----------------------------------------------------------------------------------------------------------------
  app.post('/register', jsonParser, function (req, res, next) {
    const userCitizenId = req.body.user_citizenid;

    // ตรวจสอบว่า user_citizenid เป็นตัวเลขหรือไม่
    if (!/^\d+$/.test(userCitizenId)) {
        return res.json({ status: 'error', message: 'เลขบัตรประชาชนควรเป็นตัวเลขเท่านั้น' });
    }

    if (!req.body.user_username || !req.body.user_password) {
        return res.json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }


    connection.execute(
        'SELECT * FROM users WHERE user_citizenid=?',
        [userCitizenId],
        function (err, users, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            if (users.length > 0) {
                return res.json({ status: 'error', message: 'เลขบัตรประชาชนนี้ถูกใช้ไปแล้ว' });
            }

            connection.execute(
                'INSERT INTO users (user_username, user_password, user_fname, user_lname, user_citizenid, user_phone, user_imagebase) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.body.user_username, req.body.user_password, req.body.user_fname, req.body.user_lname, userCitizenId, req.body.user_phone, uploadedImageBase64],
                function (err, results, fields) {
                    if (err) {
                        return res.json({ status: 'error', message: err });
                    }
                    return res.json({ status: 'ok' });
                }
            );
        }
    );
});

  
// Register----------------------------------------------------------------------------------------------------------------
// Login-------------------------------------------------------------------------------------------------------------------
app.post('/login', jsonParser, function (req, res, next) {
    console.log('Request Body:', req.body);
    connection.execute(
        'SELECT * FROM users WHERE user_username=?',
        [req.body.user_username],
        function (err, users, fields) {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            if (users.length === 0) {
                console.log('เข้าเงื่อนไขที่ 1 นี้');
                res.json({ status: 'error', message: 'no user found' });
                return;
            }

            const userId = users[0].user_id;

            // เปรียบเทียบรหัสผ่าน
            if (req.body.user_password === users[0].user_password) {
                console.log('เข้าเงื่อนไขที่ 2 นี้');

                connection.execute(
                    'SELECT * FROM users WHERE user_id=?',
                    [userId],
                    function (err, userData, fields) {
                        if (err) {
                            res.json({ status: 'error', message: err });
                            return;
                        }

                        const userFirstName = userData[0].user_fname;
                        var token = jwt.sign({ user_id: userData[0].user_id, username: userData[0].user_username }, secret, { expiresIn: '12h' });
                        res.json({ status: 'ok', message: 'login success', user_fname: userFirstName, token , user_id: userData[0].user_id, });
                    }
                );
            } else {
                console.log('เข้าเงื่อนไขที่ 3 นี้');
                res.json({ status: 'error', message: 'login failed' });
            }
        }
    );
});

// Login-------------------------------------------------------------------------------------------------------------------
// userDetail-------------------------------------------------------------------------------------------------------------------
app.get('/getUserInformation/:token', function (req, res) {
    // const userId = req.user.user_id; 
    const decode = jwt.verify(req.params.token, secret);
    const { user_id } = decode
    connection.execute(
        'SELECT * FROM users WHERE user_id=?',
        [user_id],
        function (err, userData) {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            if (userData.length == 0) {
                res.json({ status: 'error', message: 'no user found' })
                return
            }
            let Ususername = userData[0].user_username
            let Uspassword = userData[0].user_password
            let Usfname = userData[0].user_fname
            let Uslname = userData[0].user_lname
            let Uscitizen = userData[0].user_citizenid
            let Usphone = userData[0].user_phone
            let Usimage = userData[0].user_image
            let imgBase = userData[0].user_imagebase;
            var bufferBase64 = new Buffer.from(imgBase).toString('base64');
            console.log("bufferBase64");
            console.log(bufferBase64);
            console.log('END FETCH BASE64');
            res.json({ status: 'ok', message: 'user information retrieved',usUsername :Ususername , usPassword:Uspassword,usfname: Usfname ,uslname:Uslname,usCitizen:Uscitizen,usPhone:Usphone, usImagebase:bufferBase64});
        }
    );
});

// userDetail-------------------------------------------------------------------------------------------------------------------

app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333')
})
