var express = require('express')
var cors = require('cors')
var app = express()
const multer = require('multer');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

app.use(cors())

const mysql = require('mysql2');

const connection = mysql.createConnection({
   
    host: 'localhost',
    user: 'root',
    database: 'dtctest'
});
//upload Image----------------------------------------------------------------------------------------------------------------
// ตั้งค่า Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'D:/SDC-nodejs/uploads');  
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });
  
  
  let uploadedImagePath = ''; // เก็บค่า imagePath จาก endpoint /upload
 // upload------------------------------------------------------------------------------------------------------------------
  app.post('/upload', upload.single('image'), (req, res) => {
      uploadedImagePath = req.file.path; // เก็บค่า imagePath ที่ได้จากการอัปโหลด
      //console.log('Image path:', uploadedImagePath);
      res.status(200).json({ message: 'Image uploaded successfully' });
  });
  // upload------------------------------------------------------------------------------------------------------------------
  // Register----------------------------------------------------------------------------------------------------------------
  app.post('/register', jsonParser, function (req, res, next) {
      if (!req.body.user_username || !req.body.user_password) {
          return res.json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      } else {
          bcrypt.hash(req.body.user_password, saltRounds, function (err, hash) {  
             // console.log('Request Body:', req.body);
  
              connection.execute(
                  'INSERT INTO users (user_username, user_password, user_fname, user_lname, user_citizenid, user_phone, user_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [req.body.user_username, hash, req.body.user_fname, req.body.user_lname, req.body.user_citizenid, req.body.user_phone, uploadedImagePath],
                  function (err, results, fields) {
                      if (err) {
                          return res.json({ status: 'error', message: err });
                      }
                      return res.json({ status: 'ok' });
                  }
              );
          });
      }
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
            bcrypt.compare(req.body.user_password, users[0].user_password, function (err, isLogin) {
                if (isLogin) {
                    console.log(isLogin)
                    console.log('เข้าเงื่อนไขที่ 2 นี้');

                    connection.execute(
                        'SELECT user_fname FROM users WHERE user_id=?',
                        [userId],
                        function (err, userData, fields) {
                            if (err) {
                                res.json({ status: 'error', message: err });
                                return;
                            }

                            const userFirstName = userData[0].user_fname;

                            res.json({ status: 'ok', message: 'login success', user_fname: userFirstName });
                        }
                    );
                } else {
                    console.log('เข้าเงื่อนไขที่ 3 นี้');
                    res.json({ status: 'error', message: 'login failed' });
                }
            });
        }
    );
});

// Login-------------------------------------------------------------------------------------------------------------------
app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333')
})
