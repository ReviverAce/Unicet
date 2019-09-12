const express = require('express');
const mysql = require('mysql');
var path = require('path')
var bodyParser = require('body-parser');
const session = require('express-session');
var bcrypt = require('bcryptjs');
const app = express();
var sessions = require('client-sessions');
var csrf = require('csurf'); //security for cross site request forjery
var mysqlModel = require('mysql-model');



app.set('view engine', 'html');
app.locals.pretty = true;
app.use(express.static('bower_components'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/views'));

var sess;
var OsobaSessionID = null;
/*body-parser to parse form data into json req.body*/
app.use(bodyParser.urlencoded({
    extended: true
}));



// /* client session save session using cookie in browser*/
// app.use(sessions({
//     cookieName: 'session',
//     secret: 'kjsdfbdbkdfbijbifvkmbouiefeufbefibqew', //private secret key for sessoin data encryption
//     duration: 30 * 60 * 1000,
//     activeDuration: 5 * 60 * 1000
// }));

// app.use(csrf());
// /* on every request checking if session is set then adding user in request */
// app.use(function(req, res, next) {
//     if (req.session && req.session.user) {
//         var user = userController.getUser(req.session.user.email, function(err, user) {
//             if (user != null) {
//                 req.user = user;
//                 delete req.user.password;
//                 req.session.user = req.user;
//                 res.locals.user = req.user;
//                 next();
//             } else {
//                 next();
//             }
//         });
//     } else {
//         next();
//     }
// });

/* require login middleware can apply on routes in which we need required login */
function requireLogin(req, res, next) {
    if (!req.user) {
        res.sendFile(__dirname+'/views/loginPage.html');
    } else {
        next();
    }
}



//DB-----------------------------------------------------------------------------------------------------------------
// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'nodemysql'

});

// Connect
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySql Connected...');
});


// Create DB
app.get('/createdb', (req, res) => {
    let sql = 'CREATE DATABASE nodemysql';
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send('Database created...');
    });
});

// Create table Osoba
app.get('/createpoststableosoba', (req, res) => {
    let sqlOsoba = 'CREATE TABLE osoba(id int AUTO_INCREMENT, firstName VARCHAR(255), lastName VARCHAR(255),  email VARCHAR(255) NOT NULL, password VARCHAR(255), role VARCHAR(255),UNIQUE (email),PRIMARY KEY(id))';
    db.query(sqlOsoba, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send('Osoba table created...');
    });
});




// Create table Wniosek
app.get('/createpoststableowizyta', (req, res) => {
    let sqlOsoba = 'CREATE TABLE wizyta(idWizyta int AUTO_INCREMENT, osobaID int, rodzajBadania VARCHAR(255), sposobOdbioru VARCHAR(255),  sposobZaplaty VARCHAR(255), dataBadania  VARCHAR(255), dodatkoweUwagi VARCHAR(255),status VARCHAR(255),PRIMARY KEY(idWizyta),CONSTRAINT FK_Osoba FOREIGN KEY (osobaID) REFERENCES osoba(id))';
    db.query(sqlOsoba, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send('Wizyta table created...');
    });
});

//=============================================================================================================================




//post--------------------------------------------------------------------------------------------------------------------------

// Insert Osoba
app.post('/registrationPage', (req, res) => {
    var hash = bcrypt.hashSync(req.body.password1, bcrypt.genSaltSync(10));
    let post = { firstName: req.body.name, lastName: req.body.surrname ,email: req.body.email,password:hash,role:'klient'};
    let sql = 'INSERT INTO osoba SET ?';
    let query = db.query(sql, post, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.redirect('/main');
    });
});

//Insert wniosek
app.post('/addVisitPage', (req, res) => {
    let post = { osobaID: OsobaSessionID,rodzajBadania: req.body.examOption, sposobOdbioru: req.body.receiveOption ,sposobZaplaty: req.body.paymentOption,dataBadania: req.body.dayOfStudy,dodatkoweUwagi: req.body.comments,status:'Zarejestrowany'};
    let sql = 'INSERT INTO wizyta SET ?';
    let query = db.query(sql, post, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.redirect('/main');
    });
});



//Login
app.post('/loginPage', (req, res) => {
    var hash1 = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));//"' and password = '" + hash1+
    // console.log(hash1);
    
    db.query("SELECT * FROM osoba where email = '" + req.body.email + "'", function(err, data) {
        if(err) return console.log(err);
 

        if(bcrypt.compareSync(req.body.password,data[0].password)){
            OsobaSessionID = data[0].id;

            if(data[0].role=='Manager'){
                res.redirect('/usersPage');
            }else{
                res.redirect('/eventTrackpage');
            }
        }else{
            res.redirect('/main');
        }

      });
});






// Select single post
app.get('/accept/:id', (req, res) => {
    var tmp = req.params.id;
    tmp = tmp.substring(1,3);
    console.log(tmp);
    var sql = "UPDATE wizyta SET status = 'Zaakceptowany' WHERE idWizyta = '" + tmp + "'";
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.redirect('/usersPage');
    });
});

app.get('/rejected/:id', (req, res) => {
    var tmp = req.params.id;
    tmp = tmp.substring(1,3);
    console.log(tmp);
    var sql = "UPDATE wizyta SET status = 'Odrzucony' WHERE idWizyta = '" + tmp + "'";
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.redirect('/usersPage');
    });
});

//get---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.get('/main', function(req, res) {
        res.sendFile(__dirname+'/index.html');
});

app.get('/registrationPage', function(req, res) {
        res.sendFile(__dirname+'/views/registrationPage.html');
});

app.get('/loginPage', function(req, res) {
    if(OsobaSessionID!==null){
        OsobaSessionID=null;
        res.sendFile(__dirname+'/index.html');
    }else{
    res.sendFile(__dirname+'/views/loginPage.html');
    }
});

app.get('/eventTrackPage', function(req, res) {
    console.log("=====>>>>"+OsobaSessionID)
    if(!(OsobaSessionID === null)){
    db.query("SELECT * FROM wizyta where osobaid = '" + OsobaSessionID + "'", function(err, data) {
        if(err) return console.log(err);
        res.render('eventTrackPage.hbs',{
            wizyta: data
        });
        console.log(data);
      });}else{
          res.redirect('/loginPage');
      }
});

app.get('/addVisitPage',function(req, res) {
    if(!(OsobaSessionID === null)){
    res.sendFile(__dirname+'/views/addVisitPage.html');}else{
        res.redirect('/loginPage');
    }
});

app.get('/usersPage',function(req, res) {
    console.log("=====>>>>"+OsobaSessionID)
    if(!(OsobaSessionID === null)){
    db.query("SELECT * FROM nodemysql.wizyta w join nodemysql.osoba o on w.osobaID = o.id where w.status = 'Zarejestrowany';", function(err, data) {
        if(err) return console.log(err);
        res.render('usersPage.hbs',{
            wizyta: data
        });
        console.log(data);
      });}else{
          res.redirect('/loginPage');
      }
});


//============================================================================================================

app.listen('3000', () => {
    console.log('Server started on port 3000');
});