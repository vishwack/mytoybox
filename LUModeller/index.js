#!/usr/bin/env node
const program = require('commander');
const fParser = require('./parser');
program
    .arguments('<file>')
    .option('-s, --luis_schema_version <luis_schema_version>', 'LUIS Schema version')
    .option('-d, --luis_versionId <versionId>', 'LUIS app version')
    .option('-n, --luis_name <lName>', 'LUIS app name')
    .option('-d, --luis_desc <desc>', 'LUIS app description')
    .option('-c, --luis_culture <culture>', 'LUIS app culture')
    .option('-m, --qna_name <qName>', 'QnA KB name')
    //.option('-l, --luis-output-file <lOutFile>', 'LUIS output file name Default is <inputfilename>_LUISApp.json')
    //.option('-a, --qna-output-file <qOutFile>', 'QnA maker output file name. Default is <inputfilename>_qnaKB.json')
    .option('-q, --quiet', 'Quiet, no trace messages')
    .action(function(rootFile) {
        fParser.handleFile(rootFile, program);
    })
    .parse(process.argv);