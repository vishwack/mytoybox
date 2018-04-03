var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
const testcases = require('./testcases/testcases-data');

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
});