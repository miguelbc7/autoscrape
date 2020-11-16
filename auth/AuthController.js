const express = require('express');
const router = express.Router();
const helmet = require("helmet");
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const VerifyToken = require('./VerifyToken');

router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());
router.use(helmet());
router.use(cors());

router.post('/register', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var name = req.body.name || "";
    var email = req.body.email || "";
    var password = req.body.password || "";

    encryptPassword(password).then( (hash) => {

    }).catch( error => {
        console.error('error');
    })
});

router.post('/login', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});

router.post('/logout', VerifyToken, function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});

router.get('/me', VerifyToken, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});

encryptPassword = async (pass) => {
    new Promise( (resolve, reject) => {
        bcrypt.hash(pass, saltRounds).then( (hash) => {
            resolve(hash);
        }).catch( (err) => {
            reject(err);
        })
    });
}

module.exports = router;