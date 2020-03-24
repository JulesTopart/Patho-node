const express = require("express"),
    cors = require("cors"),
    path = require("path"),
    mysql = require("mysql"),
    fs = require("fs"),
    https = require("https");

config = require('./config');

const app = express();

init();

function init() {
    connection = mysql.createConnection({
        host: 'http://www.fc-sante.fr/',
	port:38306,
        user: 'pathosearch',
        password: '&wcL6C!fY9yV',
        database: 'emplacements',
    });

    connection.connect(function (err) {
        if (err) {
            console.log('[Error] : Error connecting to DB: ' + err.stack);
            return;
        }
        console.log('[INFO] : Connected to DB as id ' + connection.threadId);
    });

}
