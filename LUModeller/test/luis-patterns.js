var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodeller = path.resolve('../bin/lumodeller');
const fs = require('fs');

describe('Parsing LUIS patterns concepts in .lu files', function() {

    it('1 intent with patterns and list entity type in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-pattern-list.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-pattern-list_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('1 intent with patterns and pattern.any entity type in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-pattern-patternAny.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-pattern-patternAny_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('1 intent with patterns and prebuilt entity type in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-pattern-prebuilt.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-pattern-prebuilt_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('3 intents with patterns in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/3-intent-patterns.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/3-intent-patterns_LUISApp.json', 'utf8')));
            done();
        });
    });


});