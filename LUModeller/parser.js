// TODO: support for command line to specify schema version, versionID, name, desc, culture
// TODO: various error handling, negative test cases
// TODO: documentation, samples
// TODO: packaging
// TODO: Add validation rules - 
//       e.g. '{entity} in {a:value}' mixing pattern with labelled entities is not allowed.
const fs = require('fs');

module.exports = {
    handleFile(rootFile, program) {
        // handle root file and subseqntly own calling parse on other files found in rootFile
        var filesToParse = [rootFile];
        var allParsedContent = new Array();
        while(filesToParse.length > 0) {
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
        }
        var finalJSON = collateFiles(allParsedContent);
        if(!program.versionId) program.versionId = "0.1";
        if(!program.luis_schema_version) program.luis_schema_version = "2.1.0";
        if(!program.name) program.name = "myLUISApp";
        if(!program.desc) program.desc = "";
        if(!program.culture) program.culture = "en-us";   

        finalJSON.luis_schema_version = program.luis_schema_version;
        finalJSON.versionId = program.versionId;
        finalJSON.name = program.name,
        finalJSON.desc = program.desc;
        finalJSON.culture = program.culture;
        
        console.log(JSON.stringify(finalJSON, null, 2));
        
    }
};
var collateFiles = function(parsedBlobs) {
    var FinalLUISJSON = parsedBlobs[0];
    parsedBlobs.splice(0,1);
    parsedBlobs.forEach(function(blob) {
        mergeResults(blob, FinalLUISJSON, LUISObjNameEnum.INTENT);
        mergeResults(blob, FinalLUISJSON, LUISObjNameEnum.ENTITIES);
        mergeResults(blob, FinalLUISJSON, LUISObjNameEnum.PATTERNANYENTITY);
        mergeResults(blob, FinalLUISJSON, LUISObjNameEnum.CLOSEDLISTS);
        // do we have patterns here?
        if(blob.patterns.length > 0) {
            blob.patterns.forEach(function(pattern) {
                FinalLUISJSON.patterns.push(pattern);
            });
        }
        // do we have utterances here?
        if(blob.utterances.length > 0) {
            blob.utterances.forEach(function(utteranceItem) {
                FinalLUISJSON.utterances.push(utteranceItem);
            });
        }
        // do we have bing_entities here? 
        if(blob.bing_entities.length > 0) {
            blob.bing_entities.forEach(function(bingEntity) {
                if(!FinalLUISJSON.bing_entities.includes(bingEntity)) FinalLUISJSON.bing_entities.push(bingEntity);
            });
        }
        // do we have prebuiltEntities here?
        if(blob.prebuiltEntities.length > 0) {
            blob.prebuiltEntities.forEach(function(prebuiltEntity){
                var prebuiltTypeExists = false;
                for(fIndex in FinalLUISJSON.prebuiltEntities) {
                    if(prebuiltEntity.type === FinalLUISJSON.prebuiltEntities[fIndex].type) {
                        // do we have all the roles? if not, merge the roles
                        prebuiltEntity.roles.forEach(function(role) {
                            if(!FinalLUISJSON.prebuiltEntities[fIndex].roles.includes(role)) {
                                FinalLUISJSON.prebuiltEntities[fIndex].roles.push(role);
                            }
                        });
                        prebuiltTypeExists = true;
                        break;
                    }
                }
                if(!prebuiltTypeExists) {
                    FinalLUISJSON.prebuiltEntities.push(prebuiltEntity);
                }
            });
        }
    }); 
    return FinalLUISJSON;
}
var mergeResults = function(blob, finalCollection, type) {
    if(blob[type].length > 0) {
        blob[type].forEach(function(blobItem){
            // add if this intent does not already exist in finalJSON
            var itemExists = false;
            for(fIndex in finalCollection[type]) {
                if(blobItem.name === finalCollection[type][fIndex].name){
                    itemExists = true;
                    break;
                }
            }
            if(!itemExists) {
                finalCollection[type].push(blobItem);
            }
        });
    }
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
        /*"intents": [
            {
                "name":"none"
            }
        ],*/
        "intents": new Array(),
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
    // split on blank lines
    var splitOnBlankLines = fileContent.toString().split(/\n\s*\n|\r\n\s*\r\n/);
    // loop through every chunk of information
    splitOnBlankLines.forEach(function(chunk) {
        // is this an intent or entity?
        chunk = chunk.trim();
        if(chunk.indexOf(PARSERCONSTS.FILEREF) === 0) {
            var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
            var fileRef = chunkSplitByLine[0].replace(PARSERCONSTS.FILEREF + "('", '').replace(")",'').replace("'",'');
            additionalFilesToParse.push(fileRef);
        } else if(chunk.indexOf(PARSERCONSTS.INTENT) === 0) {
            // split contents in this chunk by newline
            var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
            var intentName = chunkSplitByLine[0].replace(PARSERCONSTS.INTENT, '').trim();
            // insert only if the intent is not already present.
            addItemIfNotPresent(LUISJsonStruct, LUISObjNameEnum.INTENT, intentName);
            // remove first line from chunk
            chunkSplitByLine.splice(0,1);
            chunkSplitByLine.forEach(function(utterance){
                // if utterance contains an entity, push that to patternEntity
                if(utterance.includes("{")) {
                    var entityRegex = new RegExp(/\{(.*?)\}/g);
                    var entitiesFound = utterance.match(entityRegex);
                    // handle all entity matches in the utterance
                    entitiesFound.forEach(function(entity) {
                        var labelledValue = "";
                        entity = entity.replace("{", "").replace("}", "");
                        // see if this is a trained simple entity of format {entityName:labelled value}
                        if(entity.includes(":")) {
                            var entitySplit = entity.split(":");
                            entity = entitySplit[0];
                            labelledValue = entitySplit[1];
                        }
                        if(labelledValue !== "") {
                            // add this to entities collection unless it already exists
                            addItemIfNotPresent(LUISJsonStruct, LUISObjNameEnum.ENTITIES, entity);
                            // clean up uttearnce to only include labelledentityValue and add to utterances collection
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
                            addItemIfNotPresent(LUISJsonStruct, LUISObjNameEnum.PATTERNANYENTITY, entity);
                            // add the utterance to patterns
                            var patternObject = {
                                "text": utterance,
                                "intent": intentName
                            }
                            LUISJsonStruct.patterns.push(patternObject);
                        }
                    });
                } else {
                    if(utterance.trim().indexOf("~") === 0) {
                        uttearnce = utterance.slice(1);
                        // push this utterance to patterns
                        var patternObject = {
                            "text": utterance,
                            "intent": intentName
                        }
                        LUISJsonStruct.patterns.push(patternObject);
                    } else {
                        // push this to utterances
                        var utteranceObject = {
                            "text": utterance,
                            "intent":intentName,
                            "entities": new Array()
                        }
                        LUISJsonStruct.utterances.push(utteranceObject);
                    }
                    
                }
            });
        } else if(chunk.indexOf(PARSERCONSTS.ENTITY) === 0) {
            // we have an entity definition
            // split contents in this chunk by newline
            var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
            var entityDef = chunkSplitByLine[0].replace(PARSERCONSTS.ENTITY, '').split(':');
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
                var closedListObj = {};
                
                // do we already have this closed list? 
                var hasValue = false;
                var i;
                for(i in LUISJsonStruct.closedLists) {
                    if(LUISJsonStruct.closedLists[i].name === entityName) {
                        hasValue = true;
                        break;
                    }
                }
                if(!hasValue) {
                    closedListObj.name = entityName;
                    closedListObj.subLists = new Array();
                    closedListObj.roles = new Array();
                } else {
                    closedListObj = LUISJsonStruct.closedLists[i];
                }

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
                if(!hasValue) LUISJsonStruct.closedLists.push(closedListObj);
            } else if(entityType.toLowerCase() === 'simple') {
                // add this to entities if it doesnt exist
                addItemIfNotPresent(LUISJsonStruct, LUISObjNameEnum.ENTITIES, entityName);
            }
        } 
    });
    return {
        "fParse": additionalFilesToParse,
        "LUISBlob": LUISJsonStruct
    };
    
}
const LUISObjNameEnum = {
    INTENT: "intents",
    ENTITIES: "entities",
    PATTERNANYENTITY: "patternAnyEntities",
    CLOSEDLISTS: "closedLists"
};

const PARSERCONSTS = {
    FILEREF: "#ref",
    INTENT: "#",
    ENTITY: "$"
}

var addItemIfNotPresent = function(collection, type, value) {
    var hasValue = false;
    for(var i in collection[type]) {
        if(collection[type][i].name === value) {
            hasValue = true;
            break;
        }
    }
    if(!hasValue) {
        var entityObject = {
            "name": value,
            "roles": new Array()
        }
        collection[type].push(entityObject);
    }  
}