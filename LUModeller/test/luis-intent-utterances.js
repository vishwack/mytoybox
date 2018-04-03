var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
const testcases = require('./testcases/testcases-data');

describe('Parsing LUIS intent and utterances concepts in .lu files', function() {
    it('Parsing 1 intent and 1 entity in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-1-entity"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-1-entity"].luisJSON);
    });
    it('Parsing 1 intent and labelled utterances in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-labelled-utterances"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-labelled-utterances"].luisJSON);
    });
    it('Parsing 1 intent and prebuilt entity in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent-prebuilt-entity"].lufile,false).LUISBlob, 
            testcases.tests["1-intent-prebuilt-entity"].luisJSON);
    });
    it('Parsing 1 intent in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["1-intent"].lufile,false).LUISBlob, 
            testcases.tests["1-intent"].luisJSON);
    });
    it('Parsing 2 intents and scattered list entity definition in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["2-intent-scattered-list"].lufile,false).LUISBlob, 
            testcases.tests["2-intent-scattered-list"].luisJSON);
    });
    it('Parsing 2 intents in .lu files', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests["2-intent"].lufile,false).LUISBlob, 
            testcases.tests["2-intent"].luisJSON);
    });
});