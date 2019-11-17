#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const app = express();
const path = __dirname;
const mysql = require("mysql");


var connection;
var db_code = [],
    db_lib_organe = [],
    db_lib_lesion = [],
    db_emplacement = [];


init();

app.use(cors("*"));

app.listen(3000, function() {});

app.use(express.static('./webapp'));

app.get('/', function(req, res) {
    res.sendFile(path + '/webapp/index.html');
});

app.get('/data', function(req, res) {
    console.log(req.query.keyword);

    sqlquery(req.query.keyword, function(rows) {
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
                db_emplacement.push(rows[index].emplacement);
            }

            res.send({
                code: db_code,
                lib_organe: db_lib_organe,
                lib_lesion: db_lib_lesion,
                emplacement: db_emplacement,
                error: false
            });

            db_code = [], db_lib_organe = [], db_lib_lesion = [], db_emplacement = [];
        }
    });

});

function init() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'patho_search',
        socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
    });

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
    });

}


function sqlquery(keyword, callback) {
    var query_db = "SELECT `num_exam`, `lib_organe`, `lib_lesion`, `emplacement` FROM `database` WHERE `num_exam`='" + keyword + "'";
    console.log(query_db);

    connection.query(query_db, function(err, rows) {
        if (err) {
            return callback(false);
        }

        return callback(rows);
    });
}