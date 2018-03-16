#!/usr/bin/env node
const program = require('commander');
const fParser = require('./parser');
program
    .arguments('<file>')
    .option('-s, --luis_schema_version <luis_schema_version>', 'LUIS Schema version')
    .option('-d, --versionId <versionId>', 'LUIS app version')
    .option('-n, --name <name>', 'LUIS app name')
    .option('-d, --desc <desc>', 'LUIS app description')
    .option('-c, --culture <culture>', 'LUIS app culture')
    .option('-q, --quiet', 'Quiet, no trace messages')
    .action(function(rootFile) {
        fParser.handleFile(rootFile, program);
    })
    .parse(process.argv);

    
/*
 program
  .arguments('<file>')
  .option('-u, --username <username>', 'The user to authenticate as')
  .option('-p, --password <password>', 'The user\'s password')
  .action(function(file) {
    console.log('user: %s pass: %s file: %s',
        program.username, program.password, file);
  })
  .parse(process.argv);
  */