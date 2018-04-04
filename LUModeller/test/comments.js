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

describe('Comment blocks in .lu files', function() {
    it('should be parsed correctly with 1 intent and comments specified', function() {
        assert.deepEqual(parseFileContents.parseFile(inputFileContent,false).LUISBlob, outputBlob);
    });
});