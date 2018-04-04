var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodeller = path.resolve('../bin/lumodeller');
var fs = require('fs');

describe('When handling file references, the lumodeller cli tool', function() {

    it('should handle single file references correctly', function() {
        exec(`node ${lumodeller} ./test/testcases/buyChocolate.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout), JSON.parse(fs.readFileSync('./test/output/buyChocolate_LUISApp.json')));
        });
    });

    it('should handle multi-file references correctly', function() {
        exec(`node ${lumodeller} ./test/testcases/multi-ref.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout), JSON.parse(fs.readFileSync('./test/output/multi-ref_LUISApp.json')));
        });
    });
});