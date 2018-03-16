const fs = require('fs');
//const fParser = require('./parser');

module.exports = {
    parse(fileContent) {
        var builtInTypes = 
            [
                "datetimeV2",
                "age",
                "dimension",
                "email",
                "money",
                "number",
                "ordinal",
                "percentage",
                "phoneNumber",
                "temperature",
                "url"
            ];
        var otherTypes = ['list'];

        // TODO: support for command line to specify schema version, versionID, name, desc, culture

        // TODO: support hierarchical, composite, trained utterances, entity training values

        // TODO: various error handling, negative test cases

        // TODO: documentation, samples

        // TODO: packaging

        var LUISJsonStruct = {
            "luis_schema_version": "2.1.0",
            "versionId": "0.1",
            "name": "LUModellerTest",
            "desc": "",
            "culture": "en-us",
            "intents": [
                {
                    "name": "none"
                }
            ],
            "entities": new Array(),
            "composites": new Array(),
            "closedLists": new Array(),
            "bing_entities": new Array(),
            "model_features": new Array(),
            "regex_features": new Array(),
            "utterances": new Array(),
            "patterns": new Array(),
            "patternAnyEntities": new Array(),
            "prebuiltEntities": new Array()
        };
        //console.log(fileContent.toString());
        //find the first # or $
        // split on blank lines
        var splitOnBlankLines = fileContent.toString().split(/\n\s*\n|\r\n\s*\r\n/);
        // loop through every chunk of information
        splitOnBlankLines.forEach(function(chunk) {
            // is this an intent or entity?
            chunk = chunk.trim();
            if(chunk.indexOf("#ref") === 0) {
                console.log('have external file reference:');
                var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
                var fileRef = chunkSplitByLine[0].replace("#ref(", '').replace(")",'').replace("'",'');
                console.log('file:' + fileRef);
                parseFile(fileRef);
                /*fs.stat(fileRef, (err, stats)=>{
                    if(err) console.log('Sorry, you need to give me a .lu file');
                    fs.readFile(fileRef, (err, data)=> {
                        if(err) console.log('Sorry, error reading file');
                        fParser.parse(data);
                    });
                });*/
            } else if(chunk.indexOf("#") === 0) {
                // split contents in this chunk by newline
                var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
                var intentName = chunkSplitByLine[0].replace("#", '');
                LUISJsonStruct.intents.push({
                    "name": intentName
                });
                //console.log("Intent Name: " + intentName);
                chunkSplitByLine.splice(0,1);
                chunkSplitByLine.forEach(function(utterance){
                    var patternObject = {
                        "text": utterance,
                        "intent": intentName
                    }
                    LUISJsonStruct.patterns.push(patternObject);

                    // if utterance contains an entity, push that to patternEntity
                    if(utterance.includes("{")) {
                        var entityRegex = new RegExp(/\{(.*?)\}/);
                        var entity = utterance.match(entityRegex)[1];
                        // see if we already have this in patternAny entity collection
                        var lMatch = true;
                        for(var i in LUISJsonStruct.patternAnyEntities) {
                            if(LUISJsonStruct.patternAnyEntities[i].name === entity) {
                                lMatch = false;
                                break;
                            }
                        }
                        if(lMatch) {
                            var pEntityObject = {
                                "name": entity,
                                "roles": new Array()
                            }
                            LUISJsonStruct.patternAnyEntities.push(pEntityObject);
                        }
                    }
                })
            } else if(chunk.indexOf("$") === 0) {
                // we have an entity definition
                // split contents in this chunk by newline
                var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
                var entityDef = chunkSplitByLine[0].replace("$", '').split(':');
                var entityName = entityDef[0];
                var entityType = entityDef[1];
                // see if we already have this as Pattern.Any entity
                // see if we already have this in patternAny entity collection; if so, remove it
                for(var i in LUISJsonStruct.patternAnyEntities) {
                    if(LUISJsonStruct.patternAnyEntities[i].name === entityName) {
                        LUISJsonStruct.patternAnyEntities.splice(i, 1);
                        break;
                    }
                }
                // add this entity to appropriate place
                // is this a builtin type? 
                if(builtInTypes.includes(entityType)) {
                    LUISJsonStruct.bing_entities.push(entityType);
                    // add to prebuilt entities if this does not already exist there.
                    var lMatch = true;
                    for(var i in LUISJsonStruct.prebuiltEntities) {
                        if(LUISJsonStruct.prebuiltEntities[i].type === entityType) {
                            // add the entityName as a role if it does not already exist
                            if(!LUISJsonStruct.prebuiltEntities[i].roles.includes(entityName)) {
                                LUISJsonStruct.prebuiltEntities[i].roles.push(entityName);
                            } 
                            lMatch = false;
                            break;
                        }
                    }
                    if(lMatch) {
                        var prebuiltEntitesObj = {
                            "type": entityType,
                            "roles": [entityName]
                        };
                        LUISJsonStruct.prebuiltEntities.push(prebuiltEntitesObj);
                    } 
                }

                // is this a list type?
                if(entityType.toLowerCase() === 'list') {
                    // remove the first entity declaration line
                    chunkSplitByLine.splice(0,1);
                    var closedListObj = {
                        "name": entityName,
                        "subLists": new Array(),
                        "roles": new Array()
                    };
                    
                    // TODO: do we already have this closed list? 

                    var readingSubList = false;
                    var cForm = "";
                    var synonymsList = new Array();
                    
                    // go through the list chunk and parse
                    chunkSplitByLine.forEach(function(listLine) {
                        // do we have canonicalForm on this line? 
                        if(listLine.includes(":")) {
                            // if we are already reading a sublist, push that because we have hit a new collection.
                            if(readingSubList) {
                                var subListObj = {
                                    "canonicalForm": cForm,
                                    "list": synonymsList
                                };
                                closedListObj.subLists.push(subListObj);
                                cForm = listLine.replace(':','').trim();
                                synonymsList = new Array();
                                readingSubList = false;
                            } else {
                                cForm = listLine.replace(':','').trim();
                                synonymsList = new Array();
                                readingSubList = true;
                            }
                        } else {
                            // push this line to list values
                            synonymsList.push(listLine.trim());
                        }
                    })

                    // push anything we might have left
                    var subListObj = {
                        "canonicalForm": cForm,
                        "list": synonymsList
                    };
                    closedListObj.subLists.push(subListObj);
                    LUISJsonStruct.closedLists.push(closedListObj);
                }
            } 
        })
        console.log('Final LUIS JSON::');
        console.log(JSON.stringify(LUISJsonStruct, null, 2))
    }
};

var parseFile = function (filePath) {
    console.log('(parseFile) file parse:' + filePath);
    
}