var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
const testcases = require('./testcases/testcases-data');

describe('Parsing QnA concepts .lu files', function() {
    it('Parsing', function() {
        assert.deepEqual(
            parseFileContents.parseFile(testcases.tests.qna.lufile,false).QnABlob, 
            testcases.tests.qna.qnaJSON);
    });
    
});