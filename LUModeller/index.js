#!/usr/bin/env node
const program = require('commander');
const fParser = require('./parser');
const fs = require('fs');
program
    .usage('<file>')
    .arguments('<file>')
    .action(function(file) {
        console.log('received file: ' + file);
        
        fs.stat(file, (err, stats)=>{
            if(err) console.log('Sorry, you need to give me a .lu file');
            fs.readFile(file, (err, data)=> {
                if(err) console.log('Sorry, error reading file');
                fParser.parse(data);
            });
        });
        
    })
    .parse(process.argv);