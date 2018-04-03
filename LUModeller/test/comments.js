var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodellerPath = path.resolve('../bin/lumodeller');
const fs = require('fs');
const parser = require('../parser');

describe('Parsing comments in .lu files', function() {

    it('1 intent with comments in the .lu file should be parsed correctly', function() {

        exec(`node ${lumodellerPath} ./testcases/1-intent-comment.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-comment_LUISApp.json', 'utf8')));
            done();
        });
    });

});