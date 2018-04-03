var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
const testcases = require('./testcases/testcases-data');

describe('Parsing LUIS patterns concepts in .lu files', function() {
    it('Parsing 1 intent 1 list entity in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-pattern-list"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-pattern-list"].luisJSON);
    });
    it('Parsing 1 intent 1 pattern.any entity in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-pattern-patternAny"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-pattern-patternAny"].luisJSON);
    });

    it('Parsing 1 intent 1 prebuilt entity in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-patern-prebuilt"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-patern-prebuilt"].luisJSON);
    });
    
    it('Parsing 3 intents as patterns in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["3-intents-patterns"].lufile,false).LUISBlob, 
            testcases.tests["3-intents-patterns"].luisJSON);
    });
    
});