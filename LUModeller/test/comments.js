var chai = require('chai');
var assert = chai.assert;
const parseFileContents = require('../lib/parseFileContents');
var inputFileContent = `// Definition for greeting intent
        #Greeting
        Hi
        Hello
        //users might say these
        Good morning 
        Good evening //TODO: Flush out other variations`;
var outputBlob = 
{
    "intents": [
        {
        "name": "Greeting"
        }
    ],
    "entities": [],
    "composites": [],
    "closedLists": [],
    "bing_entities": [],
    "model_features": [],
    "regex_features": [],
    "utterances": [
        {
        "text": "Hi",
        "intent": "Greeting",
        "entities": []
        },
        {
        "text": "Hello",
        "intent": "Greeting",
        "entities": []
        },
        {
        "text": "Good morning",
        "intent": "Greeting",
        "entities": []
        },
        {
        "text": "Good evening",
        "intent": "Greeting",
        "entities": []
        }
    ],
    "patterns": [],
    "patternAnyEntities": [],
    "prebuiltEntities": [],
};

describe('Parsing comments in .lu files', function() {
    it('1 intent with comments in the .lu file should be parsed correctly', function() {
        assert.deepEqual(parseFileContents.parseFile(inputFileContent,false).LUISBlob, outputBlob);
    });
});