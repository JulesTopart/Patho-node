#!/usr/bin/env node

const express = require("express"),
    cors = require("cors"),
    path = require("path"),
    mysql = require("mysql"),
    fs = require("fs"),
    https = require("https"),
    bcrypt = require('bcryptjs');

config = require('./config');
configMdp = require('../config-passwd/config');

const app = express();
const saltRounds = 10; //this variable is used to encrypt the password

// HTTPS Express
var privateKey = fs.readFileSync('/etc/letsencrypt/live/haystackly.fr/privkey.pem');
var certificate = fs.readFileSync('/etc/letsencrypt/live/haystackly.fr/fullchain.pem');

var credentials = { key: privateKey, cert: certificate };


var log = function (msg) {
    if (config.log) {
        console.log(msg);
    }
}

log("[Info] : Logging enabled");

app.use(cors());
app.use(express.static('./webapp'));

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

https.createServer(credentials, app)
    .listen(port, function () {
        log("Listening HTTPS on port : " + port);
    })


log("[Info] App listenning request from " + config.origins + " on port :" + port);
app.options('/', cors(corsOptions)) // enable pre-flight request for OPTIONS request

app.get('/', cors(corsOptions), function (req, res) {
    res.send("nothing to see here");
});

app.post('/', cors(corsOptions), function (req, res) {
    res.end("OK");
});

app.options('/data', cors(corsOptions)) // enable pre-flight request for OPTIONS request
app.options('/createUser', cors(corsOptions)); // enable pre-flight request for OPTIONS request
app.options('/signInUser', cors(corsOptions));
app.options('/search', cors(corsOptions));



var connection;
var db_code = [],
    db_lib_organe = [],
    db_lib_lesion = [],
    db_rapport = [],
    db_emplacement = [];


init();

function init() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: configMdp.passwd,
        database: 'pathosearch',
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

/**
 * ************ GET KEYWORD INFOS *******************
 */
app.get('/data', cors(corsOptions), function (req, res) {
    console.log(req.query.keyword);

    sqlqueryKey(req.query.keyword, function (rows) {
        console.log("return from DB = " + rows);

        if (rows == false) {
            res.send({
                error: true
            })
        } else {
            //ce tableau permet de faire passer l'ensemble des rapports qui sont liés à un seul code. 
            //il se peut que un code soit lié à plusieur rapports.
            for (var index = 0; index < rows.length; index++) {
                db_code.push(rows[index].Num_exam);
                db_lib_organe.push(rows[index].libelle_organe);
                db_lib_lesion.push(rows[index].libelle_lesion);
                db_rapport.push(rows[index].CR);
            }

            res.send({
                code: db_code,
                lib_organe: db_lib_organe,
                lib_lesion: db_lib_lesion,
                rapport: db_rapport,
                error: false
            });

            db_code = [], db_lib_organe = [], db_lib_lesion = [], db_rapport = [];
        }
    });
});

function sqlqueryKey(keyword, callback) {
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
    sqlcreateUser(req.query.Name, req.query.FirstName, req.query.password, req.query.UserEmail, function (rows) {
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
function sqlcreateUser(name, firstName, password, email, callback) {
    checkPresenceUser(name, firstName, function (rows) {
        if (rows == false) {
            bcrypt.hash(password, saltRounds, function (err, hash) {
                var query_db = "INSERT INTO `employees`(`name`, `first_name`, `password`, `email`) VALUES ('" + name + "','" + firstName + "','" + hash + "','" + email + "')";
                connection.query(query_db, function (err, result) {
                    if (err) throw err;

                    return callback(result);
                });
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


function sqlSignInUser(name, firstName, userPassword, callback) {

    var query_db = "SELECT `password` FROM `employees` WHERE `name` ='" + name + "' AND `first_name` = '" + firstName + "'";
    connection.query(query_db, function (err, resultDB) {
        if (err) throw err;

        if (resultDB[0].password) {
            bcrypt.compare(userPassword, resultDB[0].password, function (err, result) {
                if (err) throw err;

                if (result == true) {
                    return callback(true);
                }
            });
        }
        else return callback(false);

    });
}


/**
 * *********** SEARCH BAR *******************
 */
app.get('/search', cors(corsOptions), function (req, res) {

    sqlSearch(req.query.keyword, function (rows) {
        console.log("return from DB = " + rows);

        if (rows == false) {
            res.send({
                error: true
            })
        } else {
            //ce tableau permet de faire passer l'ensemble des rapports qui sont liés à un seul code. 
            //il se peut que un code soit lié à plusieur rapports.
            for (let index = 0; index < rows.length; index++) {
                db_code.push(rows[index].Num_exam);
                db_lib_organe.push(rows[index].libelle_organe);
                db_lib_lesion.push(rows[index].libelle_lesion);
                db_rapport.push(rows[index].CR);
            }

            res.send({
                code: db_code,
                lib_organe: db_lib_organe,
                lib_lesion: db_lib_lesion,
                rapport: db_rapport,
                error: false
            });

            db_code = [], db_lib_organe = [], db_lib_lesion = [], db_rapport = [];
        }
    });
});

function sqlSearch(keywords, callback) {
    console.log("keywords :", keywords);

    var query = "SELECT `Num_exam`,`libelle_organe`,`libelle_lesion`,`CR`, MATCH(`CR`) AGAINST ('" + keywords + "' IN NATURAL LANGUAGE MODE) AS SCORE FROM `database` ORDER BY SCORE DESC"

    connection.query(query, function (err, rows) {
        if (err) {
            return callback(false);
        }

        return callback(rows);
    });
}