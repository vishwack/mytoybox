var chai = require('chai');
var assert = chai.assert;
var path = require('path');
const {exec} = require('child_process');
const lumodeller = path.resolve('../bin/lumodeller');
const fs = require('fs');

describe('Parsing LUIS entity types in .lu files', function() {
    
    it('all entity types the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/all-entity-types.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/all-entity-types_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('1 intent and 1 entity in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-1-entity.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-1-entity_LUISApp.json', 'utf8')));
            done();
        });
    });
    
    it('2 intents with scattered list entity type in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/2-intent-scattered-list.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/2-intent-scattered-list_LUISApp.json', 'utf8')));
            done();
        });
    });

    it('1 intent with prebuilt entity type in the .lu file should be parsed correctly', function() {
        exec(`node ${lumodeller} ./testcases/1-intent-prebuilt-entity.lu -q -g`, (error, stdout, stderr) => {
            assert.deepEqual(JSON.parse(stdout),JSON.parse(fs.readFileSync('./output/1-intent-prebuilt-entity_LUISApp.json', 'utf8')));
            done();
        });
    });

});