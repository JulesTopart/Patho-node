#!/usr/bin/env node

const config = {
    port: 3000,
    log: false,
    origins: [
        'https://haystackly.fr',
        'http://haystackly.fr'
    ]
};

module.exports = config;