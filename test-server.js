const express = require("express"),
    cors = require("cors"),
    path = require("path"),
    mysql = require("mysql"),
    fs = require("fs"),
    https = require("https");

config = require('./config');

const app = express();

init();
sqlquery(5901234123457);

function init() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'MGZiYmNmNWU0ZDMx',
        database: 'pathoSearch',
        socketPath: '/var/run/mysqld/mysqld.sock'
    });

    connection.connect(function (err) {
        if (err) {
            console.log('[Error] : Error connecting to DB: ' + err.stack);
            return;
        }
        console.log('[INFO] : Connected to DB as id ' + connection.threadId);
    });

}

function sqlquery(keyword) {
    var query_db = "SELECT `num_exam`, `lib_organe`, `lib_lesion`, `rapport`, `emplacement` FROM `database` WHERE `num_exam`='" + keyword + "'";
    console.log(query_db);

        connection.query(query_db, function (err, result, fields) {
        if (err) throw err;
        	console.log(result);
        });
    
}
