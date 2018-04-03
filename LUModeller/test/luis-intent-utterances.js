var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodeller = path.resolve('../bin/lumodeller');
const fs = require('fs');

describe('Parsing LUIS intent and utterances concepts in .lu files', function() {

    it('1 intent in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('1 intent with labelled utterances in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-labelled-utterances.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-labelled-utterances_LUISApp.json', 'utf8')));
            done();
        });
    });
   
    it('2 intents in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/2-intent.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/2-intent_LUISApp.json', 'utf8')));
            done();
        });
    });
});