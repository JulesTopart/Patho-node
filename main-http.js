#!/usr/bin/env node

const express = require("express"),
    cors = require("cors"),
    path = require("path"),
    mysql = require("mysql"),
    fs = require("fs"),
    http = require("http");

config = require('./config');
configMdp = require('../config-passwd/config');


const app = express();

var log = function (msg) {
    if (config.log) {
        console.log(msg);
    }
}

log("[Info] : Logging enabled");

app.use(cors());

var basepath = path.resolve(__dirname);

var whitelist = config.origins;
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200
}

var port = config.port;

log("[Info] App listenning request from " + config.origins + " on port :" + port);
app.options('/', cors(corsOptions)); // enable pre-flight request for OPTIONS request

app.get('/', cors(corsOptions), function (req, res) {
    res.send("nothing to see here");
});

app.post('/', cors(corsOptions), function (req, res) {
    res.end("OK");
});

app.options('/data', cors(corsOptions)); // enable pre-flight request for OPTIONS request
app.options('/createUser', cors(corsOptions)); // enable pre-flight request for OPTIONS request
app.options('/signInUser', cors(corsOptions));

app.listen(port);


var connection;
var db_code = [],
    db_lib_organe = [],
    db_lib_lesion = [],
    db_rapport = [],
    db_emplacement = [];


init();


app.get('/data', cors(corsOptions), function (req, res) {
    sqlquery(req.query.keyword, function (rows) {
        console.log("return from DB = " + rows);

        if (rows == false) {
            res.send({
                error: true
            })
        } else {
            //ce tableau permet de faire passer l'ensemble des rapports qui sont liés à un seul code. 
            //il se peut que un code soit lié à plusieur rapports.
            for (var index = 0; index < rows.length; index++) {
                db_code.push(rows[index].num_exam);
                db_lib_organe.push(rows[index].lib_organe);
                db_lib_lesion.push(rows[index].lib_lesion);
                db_rapport.push(rows[index].rapport);
                db_emplacement.push(rows[index].emplacement);
            }

            res.send({
                code: db_code,
                lib_organe: db_lib_organe,
                lib_lesion: db_lib_lesion,
                rapport: db_rapport,
                emplacement: db_emplacement,
                error: false
            });

            db_code = [], db_lib_organe = [], db_lib_lesion = [], db_rapport = [], db_emplacement = [];
        }
    });

});


//TODO Hide pass
function init() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: configMdp.passwd,
        database: 'pathoSearch',
        socketPath: '/var/run/mysqld/mysqld.sock'
    });

    connection.connect(function (err) {
        if (err) {
            log('[Error] : Error connecting to DB: ' + err.stack);
            return;
        }
        log('[INFO] : Connected to DB as id ' + connection.threadId);
    });

}


function sqlquery(keyword, callback) {
    var query_db = "SELECT `num_exam`, `lib_organe`, `lib_lesion`, `rapport`, `emplacement` FROM `database` WHERE `num_exam`='" + keyword + "'";

    connection.query(query_db, function (err, rows) {
        if (err) {
            return callback(false);
        }

        return callback(rows);
    });
}

/************************** USER SIGNUP ***************************/
app.get('/createUser', cors(corsOptions), function (req, res) {
    sqlcreateUser(req.query.Name, req.query.FirstName, req.query.password, req.query.UserEmail, req.query.profilePicture, function (rows) {
        if (rows == false) {
            res.send({
                userCreatorError: true,
                userCreatormessage: "Une erreur c'est produite lors de la création de votre compte"
            })
        }
        else {
            res.send({
                userCreatorError: false,
                userCreatormessage: "Votre compte a été crée"
            })

        }
    });
});

//TODO add the picture in the query
function sqlcreateUser(name, firstName, password, email, profilePicture, callback) {
    checkPresenceUser(name, firstName, function (rows) {
        if (rows == false) {
            var query_db = "INSERT INTO `employees`(`name`, `first_name`, `password`, `profilePicture`, `email`) VALUES ('" + name + "','" + firstName + "','" + password + "','" + profilePicture + "','" + email + "')";
            connection.query(query_db, function (err, result) {
                if (err) throw err;

                return callback(result);
            });
        }
        else {
            return callback(false);
        }

    });

}

function checkPresenceUser(name, first_name, callback) {
    var query_db = "SELECT `name` FROM `employees` WHERE `name` ='" + name + "' AND `first_name` = '" + first_name + "'";
    connection.query(query_db, function (err, result) {
        if (err) throw err;

        return callback(result);
    });
}


/************************** USER SIGNIN ***************************/
app.get('/signInUser', cors(corsOptions), function (req, res) {
    sqlSignInUser(req.query.Name, req.query.FirstName, req.query.password, function (rows) {
        if (rows == false) {
            res.send({
                userSignInError: true,
                userSignInMessage: "Une erreur c'est produite lors de la connexion"
            })
        }
        else {
            res.send({
                userSignInError: false,
                userSignInMessage: "Connecté"
            })
        }
    });
});


function sqlSignInUser(name, firstName, password, callback) {

    var query_db = "SELECT `name` FROM `employees` WHERE `name` ='" + name + "' AND `first_name` = '" + firstName + "' AND `password`= '" + password + "'";
    connection.query(query_db, function (err, result) {
        if (err) throw err;

        return callback(result);
    });

}