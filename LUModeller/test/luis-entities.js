var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
const testcases = require('./testcases/testcases-data');
const {exec} = require('child_process');
var path = require('path');
const lumodeller = path.resolve('../bin/lumodeller');

describe('Parsing LUIS entity types in .lu files', function() {
    it('Parsing all entity types in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["all-entity-types"].lufile,false).LUISBlob, 
            testcases.tests["all-entity-types"].luisJSON);
    });
    
    it('Parsing phraselists in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests.phraselist.lufile,false).LUISBlob, 
            testcases.tests.phraselist.luisJSON);
    });

    it('should show WARN message when no utterances are found for an intent', function() {
        exec(`node ${lumodeller} ./test/testcases/bad3.lu`, (error, stdout, stderr) => {
            assert(stdout.includes('[WARN] No utterances found for intent'));
            done();
        });
    });
});