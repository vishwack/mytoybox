// TODO: support for command line to specify schema version, versionID, name, desc, culture
// TODO: support hierarchical, composite, trained utterances, entity training values
// TODO: various error handling, negative test cases
// TODO: documentation, samples
// TODO: bug with multiple #ref in a file (just that)
// TODO: packaging
const fs = require('fs');

module.exports = {
    handleFile(rootFile, program) {
        // handle root file and subseqntly own calling parse on other files found in rootFile
        var filesToParse = [rootFile];
        var allParsedContent = new Array();
        while(filesToParse.length > 0) {
            //filesToParse.forEach(function(file) {
                var file = filesToParse[0];
                fs.stat(file, (err, stats) => {
                    if(err) console.log('Sorry, you need to give me a .lu file [' + file + ']');        
                });
                var fileContent = fs.readFileSync(file);
                if (!fileContent) {
                    console.log('Sorry, error reading file:' + file);    
                }
                if(!program.quiet) console.log('---Parsing file: ' + file);
                var parsedContent = parseFile(fileContent);
                if (!parsedContent) {
                    console.log('Sorry, file ' + file + 'had invalid content');
                } else {
                    if(!program.quiet)console.log('---Parsing complete: ' + file);
                    allParsedContent.push(parsedContent.LUISBlob);
                }
                // remove this file from the list
                filesToParse.splice(0,1);
                // add additional files to parse to the list
                if(parsedContent.fParse.length > 0) {
                    parsedContent.fParse.forEach((file) => filesToParse.push(file));
                }
                if(filesToParse.length > 0) {
                    if(!program.quiet)console.log('parsing more files..' + JSON.stringify(filesToParse));
                }
            //})
        }
        // collate content

        
        //console.log('----Collate call----');
        var finalJSON = collateFiles(allParsedContent);
        

        // TODO: get these as command line args
        /*"luis_schema_version": "2.1.0",
            "versionId": "0.1",
            "name": "LUModellerTest",
            "desc": "",
            "culture": "en-us",
        */

        finalJSON.luis_schema_version = "2.1.0";
        finalJSON.versionId = "0.1";
        finalJSON.name = "LUModellerTest",
        finalJSON.desc = "";
        finalJSON.culture = "en-us";
        
        console.log(JSON.stringify(finalJSON, null, 2));
        
    }
};
var collateFiles = function(parsedBlobs) {
    // TODO: finish up collate
    var FinalLUISJSON = parsedBlobs[0];
    parsedBlobs.splice(0,1);
    parsedBlobs.forEach(function(blob) {
        // do we have intents here? 
        if(blob.intents.length > 0) {
            var intentExists = false;
            for(bIndex in blob.intents) {
                // add this if this does not already exist in final
                for(fIndex in FinalLUISJSON.intents) {
                    if(blob.intents[bIndex].name === FinalLUISJSON.intents[fIndex].name) {
                        intentExists = true;
                        break;
                    }
                }
                if(intentExists) break;
                else {
                    FinalLUISJSON.intents.push({
                        "name": blob.intents[bIndex].name
                    });
                }
            }
        }

        // do we have patterns here?
        if(blob.patterns.length > 0) {
            blob.patterns.forEach(function(pattern) {
                FinalLUISJSON.patterns.push(pattern);
            })
        }
    }); 
    return FinalLUISJSON;
}
var parseFile = function(fileContent) 
{
    var additionalFilesToParse = new Array();
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

    var LUISJsonStruct = {
        "intents": [
            {
                "name":"none"
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
    //find the first # or $
    // split on blank lines
    var splitOnBlankLines = fileContent.toString().split(/\n\s*\n|\r\n\s*\r\n/);
    // loop through every chunk of information
    splitOnBlankLines.forEach(function(chunk) {
        // is this an intent or entity?
        chunk = chunk.trim();
        if(chunk.indexOf("#ref") === 0) {
            //console.log('have external file reference:');
            var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
            var fileRef = chunkSplitByLine[0].replace("#ref('", '').replace(")",'').replace("'",'');
            //console.log('file:' + fileRef);
            additionalFilesToParse.push(fileRef);
        } else if(chunk.indexOf("#") === 0) {
            // split contents in this chunk by newline
            var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
            var intentName = chunkSplitByLine[0].replace("#", '');
            // TODO: insert only if the intent is not already there.
            LUISJsonStruct.intents.push({
                "name": intentName
            });
            chunkSplitByLine.splice(0,1);
            chunkSplitByLine.forEach(function(utterance){
                

                // if utterance contains an entity, push that to patternEntity
                // TODO: handle multiple entity matches in a line
                if(utterance.includes("{")) {
                    var entityRegex = new RegExp(/\{(.*?)\}/);
                    var entity = utterance.match(entityRegex)[1];
                    var labelledValue = "";
                    // see if this is a trained simple entity of format {entityName:labelled value}
                    if(entity.includes(":")) {
                        var entitySplit = entity.split(":");
                        entity = entitySplit[0];
                        labelledValue = entitySplit[1];
                    }

                    if(labelledValue !== "") {
                        // add this to entities collection unless it already exists
                        var lMatch = true;
                        for(var i in LUISJsonStruct.entities) {
                            if(LUISJsonStruct.entities[i].name === entity) {
                                lMatch = false;
                                break;
                            }
                        }
                        if(lMatch) {
                            var pEntityObject = {
                                "name": entity,
                                "roles": new Array()
                            }
                            LUISJsonStruct.entities.push(pEntityObject);
                        }
                        // add the utterance to utterances collection
                        // clean up uttearnce to only include labelledentityValue
                        var updatedUtterance = utterance.replace("{" + entity + ":" + labelledValue + "}", labelledValue);
                        var startPos = updatedUtterance.search(labelledValue);
                        var endPos = startPos + labelledValue.length - 1;
                        var utteranceObject = {
                            "text": updatedUtterance,
                            "intent":intentName,
                            "entities": [
                                {
                                    "entity": entity,
                                    "startPos":startPos,
                                    "endPos":endPos
                                }
                            ]
                        }
                        LUISJsonStruct.utterances.push(utteranceObject);
                    } else {
                        // these need to be treated as pattern entity
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
                        // add the utterance to patterns
                        var patternObject = {
                            "text": utterance,
                            "intent": intentName
                        }
                        LUISJsonStruct.patterns.push(patternObject);
                    }


                } else {
                    // push this to patterns
                    // add the utterance to patterns
                    var patternObject = {
                        "text": utterance,
                        "intent": intentName
                    }
                    LUISJsonStruct.patterns.push(patternObject);
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
            } else if(entityType.toLowerCase() === 'simple') {
                // add this to entities if it doesnt exist
                var lMatch = true;
                for(var i in LUISJsonStruct.entities) {
                    if(LUISJsonStruct.entities[i].name === entityName) {
                        lMatch = false;
                        break;
                    }
                }
                if(lMatch) {
                    var pEntityObject = {
                        "name": entityName,
                        "roles": new Array()
                    }
                    LUISJsonStruct.entities.push(pEntityObject);
                }
            }
        } 
    });
    return {
        "fParse": additionalFilesToParse,
        "LUISBlob": LUISJsonStruct
    };
    
}
