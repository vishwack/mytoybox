var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodeller = path.resolve('../bin/lumodeller');

describe('The lumodeller cli tool', function() {

    it('should print the help contents when --help is passed as an argument', function() {
        exec(`node ${lumodeller} --help`, (error, stdout, stderr) => {
            assert(stdout.includes('-o') && stdout.includes('--gen_qna_only'));
            done();
        });
    });

    it('should show an error message when root file is missing', function() {
        exec(`node ${lumodeller}`, (error, stdout, stderr) => {
            assert(stdout.includes('No .lu file specified.'));
            done();
        });
    });

    it('should show an error message when output folder is missing and -o specified', function() {
        exec(`node ${lumodeller} -o`, (error, stdout, stderr) => {
            assert(stdout.includes('error:') && stdout.includes('argument missing'));
            done();
        });
    });

    it('should show ERROR when no parser decorations are found in a line', function() {
        exec(`node ${lumodeller} ./test/testcases/bad2.lu`, (error, stdout, stderr) => {
            assert(stdout.includes('not part of a Intent/ Entity/ QnA'));
            done();
        });
    });

    
});