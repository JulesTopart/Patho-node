#!/usr/bin/env node

const config = {
    port: 3000,
    log: true,
    origins: [
        'https://haystackly.fr',
        'http://haystackly.fr',
        'http://localhost:8081',
        'http://localhost:8080'
    ]
};

module.exports = config;