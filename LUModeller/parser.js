const fs = require('fs');
const path = require('path');

module.exports = {
    handleFile(rootFile, program) {
        // handle root file and subseqntly own calling parse on other files found in rootFile
        var filesToParse = [rootFile];
        var allParsedLUISContent = new Array();
        var allParsedQnAContent = new Array();
        while(filesToParse.length > 0) {
            var file = filesToParse[0];
            fs.stat(file, (err, stats) => {
                if(err) {
                    console.error('Sorry unable to open [' + file + ']');        
                    return;
                }
            });
            var fileContent = fs.readFileSync(file);
            if (!fileContent) {
                console.error('Sorry, error reading file:' + file);    
            }
            if(!program.quiet) console.log('---Parsing file: ' + file);
            var parsedContent = parseFile(fileContent, program.quiet);
            if (!parsedContent) {
                console.error('Sorry, file ' + file + 'had invalid content');
            } else {
                if(!program.quiet)console.log('---Parsing complete: ' + file);
                allParsedLUISContent.push(parsedContent.LUISBlob);
                allParsedQnAContent.push(parsedContent.QnABlob);
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
        var finalLUISJSON = collateLUISFiles(allParsedLUISContent);
        var finalQnAJSON = collateQnAFiles(allParsedQnAContent);
        if(!program.versionId) program.versionId = "0.1";
        if(!program.luis_schema_version) program.luis_schema_version = "2.1.0";
        if(!program.lName) program.lName = path.basename(rootFile, path.extname(rootFile));
        if(!program.desc) program.desc = "";
        if(!program.culture) program.culture = "en-us";   
        if(!program.qName) program.qName = path.basename(rootFile, path.extname(rootFile));
        finalLUISJSON.luis_schema_version = program.luis_schema_version;
        finalLUISJSON.versionId = program.versionId;
        finalLUISJSON.name = program.lName,
        finalLUISJSON.desc = program.desc;
        finalLUISJSON.culture = program.culture;

        finalQnAJSON.name = program.qName;
        if(!program.lOutFile) program.lOutFile = path.basename(rootFile, path.extname(rootFile)) + "_LUISApp.json";
        if(!program.qOutFile) program.qOutFile = path.basename(rootFile, path.extname(rootFile)) + "_qnaKB.json";
        var writeQnAFile = (finalQnAJSON.qnaPairs.length > 0) || 
                           (finalQnAJSON.urls.length > 0);

        var  writeLUISFile = (finalLUISJSON[LUISObjNameEnum.INTENT].length > 0) ||
                             (finalLUISJSON[LUISObjNameEnum.ENTITIES].length > 0) || 
                             (finalLUISJSON[LUISObjNameEnum.PATTERNANYENTITY].length > 0) ||
                             (finalLUISJSON[LUISObjNameEnum.CLOSEDLISTS].length > 0) ||
                             (finalLUISJSON.patterns.length > 0) ||
                             (finalLUISJSON.utterances.length > 0) ||
                             (finalLUISJSON.bing_entities.length > 0) ||
                             (finalLUISJSON.prebuiltEntities.length > 0) ||
                             (finalLUISJSON.model_features.length > 0);

        if(!program.quiet) {
            if(writeLUISFile) {
                console.log('-----------------------------------');
                console.log('          FINAL LUIS JSON          ');
                console.log('-----------------------------------');
                console.log(JSON.stringify(finalLUISJSON, null, 2));
                console.log();    
            }
            if(writeQnAFile) {
                console.log('-----------------------------------');
                console.log('          FINAL QnA JSON          ');
                console.log('-----------------------------------');
                console.log(JSON.stringify(finalQnAJSON, null, 2));
            }
        }

        if(writeLUISFile) {
            // write out the final LUIS Json
            fs.writeFileSync(program.lOutFile, JSON.stringify(finalLUISJSON, null, 2), function(error) {
                if(error) {
                    console.error('Unable to write LUIS JSON file - ' + program.lOutFile);
                } 
            });
            if(!program.quiet) console.log('Successfully wrote LUIS model to ' + program.lOutFile);
        }

        if(writeQnAFile) {
            // write out the final LUIS Json
            fs.writeFileSync(program.qOutFile, JSON.stringify(finalQnAJSON, null, 2), function(error) {
                if(error) {
                    console.error('Unable to write LUIS JSON file - ' + program.qOutFile);
                } 
            });
            if(!program.quiet) console.log('Successfully wrote LUIS model to ' + program.qOutFile);
        }
    }
};
var collateQnAFiles = function(parsedBlobs) {
    var FinalQnAJSON = parsedBlobs[0];
    parsedBlobs.splice(0,1);
    parsedBlobs.forEach(function(blob) {
        // does this blob have URLs?
        if(blob.urls.length > 0) {
            // add this url if this does not already exist in finaljson
            blob.urls.forEach(function(qnaUrl) {
                if(!FinalQnAJSON.urls.includes(qnaUrl)) {
                    FinalQnAJSON.urls.push(qnaUrl);
                }
            });
        }

        // does this blob have qnapairs?
        if(blob.qnaPairs.length > 0) {
            // walk through each qnaPair and add it if the question does not exist
            blob.qnaPairs.forEach(function(qnaPair) {
                var qnaExists = false;
                var fIndex = 0;
                for(fIndex in FinalQnAJSON.qnaPairs) {
                    if(qnaPair.question === FinalQnAJSON.qnaPairs[fIndex].question) {
                        qnaExists = true;
                        break;
                    }
                }
                if(!qnaExists) {
                    FinalQnAJSON.qnaPairs.push(qnaPair);
                }
            });
        }
    });
    return FinalQnAJSON;
}
var collateLUISFiles = function(parsedBlobs) {
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
        // do we have model_features?
        if(blob.model_features.length > 0) {
            blob.model_features.forEach(function(modelFeature) {
                var modelFeatureExists = false;
                for(fIndex in FinalLUISJSON.model_features) {
                    if(modelFeature.name === FinalLUISJSON.model_features[fIndex].name) {
                        // add values to the existing model feature
                        FinalLUISJSON.model_features[fIndex].words += "," + modelFeature.words;
                        modelFeatureExists = true;
                        break;
                    }
                }
                if(!modelFeatureExists) {
                    FinalLUISJSON.model_features.push(modelFeature);
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
var validateAndPushCurrentBuffer = function(previousSection, sectionsInFile, currentSectionType, lineIndex) {
    switch(currentSectionType) {
        case PARSERCONSTS.INTENT:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                console.warn(lineIndex + ': [WARN] No utterances found for intent: ' + previousSection.split(/\r\n/)[0]);
            }
            sectionsInFile.push(previousSection);
            break;
        case PARSERCONSTS.QNA:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                console.warn(lineIndex + ': [WARN] No answer found for question' + previousSection.split(/\r\n/)[0]);
            }
            sectionsInFile.push(previousSection);
            break;
        case PARSERCONSTS.ENTITY:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                console.warn(lineIndex + ': [WARN] No list entity definition found for entity:' + previousSection.split(/\r\n/)[0]);
            }
            sectionsInFile.push(previousSection);
            break;
        default:
            sectionsInFile.push(previousSection);
    }
    return sectionsInFile;
}
var splitFileBySections = function(fileContent) {
    var linesInFile = fileContent.split(/\n|\r\n/);
    var currentSection = null;
    var middleOfSection = false;
    var sectionsInFile = [];
    var currentSectionType = null; //PARSERCONSTS
    for(lineIndex in linesInFile) {
        var currentLine = linesInFile[lineIndex].trim();
        // skip line if it is just a comment
        if(currentLine.indexOf(PARSERCONSTS.COMMENT) === 0) continue;
        // skip line if it is blank
        if(currentLine === "") continue;
        // drop any contents in this line after a comment block
        // e.g. #Greeting //this is the root intent should return #Greeting
        // #Greeting \// this should be considered should return everything
        var currentLineWithoutComments = currentLine.split(/\/\/\s*/); 
        if(currentLineWithoutComments.length > 0) {
            // exclude http[s]://
            if(!currentLineWithoutComments[0].includes('http')) currentLine = currentLineWithoutComments[0].trim();
        }

        // is this a FILEREF or URLREF section? 
        if((currentLine.indexOf(PARSERCONSTS.FILEREF) === 0) ||
           (currentLine.indexOf(PARSERCONSTS.URLREF) === 0)) {
            // handle anything in currentSection buffer
            if(currentSection !== null) {
                var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
                sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
            }
            currentSection = null;
            sectionsInFile.push(currentLine);
            middleOfSection = false;
        } else if((currentLine.indexOf(PARSERCONSTS.INTENT) === 0)) {
            // handle anything in currentSection buffer
            if(currentSection !== null) {
                var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
                sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
            }
            middleOfSection = true;
            currentSectionType = PARSERCONSTS.INTENT;
            currentSection = currentLine + "\r\n";
        } else if((currentLine.indexOf(PARSERCONSTS.ENTITY) === 0)) {
            // handle anything in currentSection buffer
            if(currentSection !== null) {
                var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
                sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
            }
            // only list entity types can have multi-line definition
            if(currentLine.includes(':list')){
                middleOfSection = true;
                currentSectionType = PARSERCONSTS.ENTITY;
                currentSection = currentLine + "\r\n";
            } else {
                sectionsInFile.push(currentLine);
                middleOfSection = false;
                currentSection = null;
            }
        } else if((currentLine.indexOf(PARSERCONSTS.QNA) === 0)) {
            // there can be multiple questions to answer here. So keep adding.
            middleOfSection = true;
            currentSectionType = PARSERCONSTS.QNA;
            if(currentSection !== null) {
                currentSection += currentLine + "\r\n";
            } else {
                currentSection = currentLine + "\r\n";
            }            
        } else {
            if(middleOfSection) {
                currentSection += currentLine + "\r\n";
                // did we just have an answer for QnA? 
                if(currentSectionType === PARSERCONSTS.QNA) {
                    var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
                    sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
                    currentSection = null;
                    middleOfSection = false;
                    currentSectionType = null;
                }
            } else {
                console.log('Error: Line ' + lineIndex + ' is not part of a Intent/ Entity/ QnA');
                console.log('Stopping further processing.');
                process.exit(1);
            }
        }
    }
    // handle anything in currentSection buffer
    if(currentSection !== null) {
        var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
        sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
    }
    console.log('FINAL SECTIONS IN FILE');
    console.log(JSON.stringify(sectionsInFile, null, 2));
    return sectionsInFile;
}
var parseFile = function(fileContent, log) 
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
    var qnaJsonStruct = {
        "qnaPairs": new Array(),
        "urls": new Array()
    }
    var splitOnBlankLines = splitFileBySections(fileContent.toString());

    // loop through every chunk of information
    splitOnBlankLines.forEach(function(chunk) {
        // is this an intent or entity?
        chunk = chunk.trim();
        // ignore if this line is a comment.

        // TODO: ignore inline comments
        if(!(chunk.indexOf(PARSERCONSTS.COMMENT) === 0)) {
            if(chunk.indexOf(PARSERCONSTS.URLREF) === 0) {
                var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
                var urlRef = chunkSplitByLine[0].replace(PARSERCONSTS.URLREF + "('", '').replace(")",'').replace("'",'');
                qnaJsonStruct.urls.push(urlRef);
            } else if(chunk.indexOf(PARSERCONSTS.FILEREF) === 0) {
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
                chunkSplitByLine.forEach(function(utterance)
                {
                    // is this a pattern? 
                    if(utterance.trim().indexOf("~") === 0) {
                        // push this utterance to patterns
                        var patternObject = {
                            "text": utterance.slice(1),
                            "intent": intentName
                        }
                        LUISJsonStruct.patterns.push(patternObject);
                        if(utterance.includes("{")) {
                            // handle entities
                            var entityRegex = new RegExp(/\{(.*?)\}/g);
                            var entitiesFound = utterance.match(entityRegex);
                            entitiesFound.forEach(function(entity) {
                                entity = entity.replace("{", "").replace("}", "");
                                addItemIfNotPresent(LUISJsonStruct, LUISObjNameEnum.PATTERNANYENTITY, entity);
                            });
                        }
                    } else {
                        if(utterance.includes("{")) {
                            var entityRegex = new RegExp(/\{(.*?)\}/g);
                            var entitiesFound = utterance.match(entityRegex);
                        
                            // treat this as labelled utterance
                            entitiesFound.forEach(function(entity) {
                                var labelledValue = "";
                                entity = entity.replace("{", "").replace("}", "");
                                // see if this is a trained simple entity of format {entityName:labelled value}
                                if(entity.includes(":")) {
                                    var entitySplit = entity.split(":");
                                    entity = entitySplit[0];
                                    labelledValue = entitySplit[1];
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
                                        if(!log) console.log('WARN: No labelled value found for entity: ' + entity + ' in utterance: ' + utterance);
                                    }
                                } else {
                                    if(!log)  console.log('WARN: Entity ' + entity + ' in utterance: "' + utterance + '" is missing labelled value');
                                }
                            });
                        } else {
                            // push this to utterances
                            var utteranceObject = {
                                "text": utterance,
                                "intent": intentName,
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
                    // add to bing_entities if it does not exist there.
                    if(!LUISJsonStruct.bing_entities.includes(entityType)) LUISJsonStruct.bing_entities.push(entityType);
                    if(entityName !== "PREBUILT") {
                        // add to prebuilt entities if this does not already exist there and if this is not PREBUILT
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
                }
    
                // is this a list type?
                else if(entityType.toLowerCase() === 'list') {
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
                } else if(entityType.toLowerCase() === 'phraselist') {
                    // add this to phraseList if it doesnt exist
                    chunkSplitByLine.splice(0,1);
                    var pLValues = "";
                    chunkSplitByLine.forEach(function(phraseListValues) {
                        pLValues = pLValues + phraseListValues + ',';
                    });
                    // remove the last ',' 
                    pLValues = pLValues.substring(0, pLValues.lastIndexOf(","));
                    var modelExists = false;
                    if(LUISJsonStruct.model_features.length > 0) {
                        var modelIdx = 0;
                        for(modelIdx in LUISJsonStruct.model_features) {
                            if(LUISJsonStruct.model_features[modelIdx].name === entityName) {
                                modelExists = true;
                                break;
                            }
                        }
                        if(modelExists) {
                            LUISJsonStruct.model_features[modelIdx].words += ',' + pLValues;
                        } else {
                            var modelObj = {
                                "name": entityName,
                                "mode": false,
                                "words": pLValues,
                                "activated": true
                            };
                            LUISJsonStruct.model_features.push(modelObj);
                        }
                    } else {
                        var modelObj = {
                            "name": entityName,
                            "mode": false,
                            "words": pLValues,
                            "activated": true
                        };
                        LUISJsonStruct.model_features.push(modelObj);
                    }
                }
            } else if(chunk.indexOf(PARSERCONSTS.QNA) === 0) {
                // split contents in this chunk by newline
                var chunkSplitByLine = chunk.split(/\r\n|\r|\n/g);
                var qnaQuestions = new Array();
                var qnaAnswer = "";
                chunkSplitByLine.forEach(function (qnaLine) {
                    qnaLine = qnaLine.trim();
                    // is this a question or answer?
                    if(qnaLine.indexOf(PARSERCONSTS.QNA) === 0) {
                        qnaQuestions.push(qnaLine.replace(PARSERCONSTS.QNA, '').trim());
                    } else {
                        qnaAnswer = qnaLine;
                    }
                });
                // for each question, add a qna pair
                qnaQuestions.forEach(function(qnaQuestion) {
                    var qnaObj = {
                        "answer": qnaAnswer,
                        "question": qnaQuestion
                    };
                    qnaJsonStruct.qnaPairs.push(qnaObj);
                });
            } else {
                //error. No Parser decoration found
                if(!log) {
                    console.error('ERROR: No parser decoration found. Sections need to start with # or $ or ? or #ref or #url');
                    console.error(chunk.toString());
                }
            } 
        }

    });
    return {
        "fParse": additionalFilesToParse,
        "LUISBlob": LUISJsonStruct,
        "QnABlob": qnaJsonStruct
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
    ENTITY: "$",
    QNA: "?",
    URLREF: "#url",
    COMMENT: "//"
};


var addItemIfNotPresent = function(collection, type, value) {
    var hasValue = false;
    for(var i in collection[type]) {
        if(collection[type][i].name === value) {
            hasValue = true;
            break;
        }
    }
    if(!hasValue) {
        var itemObj = {};
        itemObj.name = value;
        if(type !== LUISObjNameEnum.INTENT) {
            itemObj.roles = new Array();
        }
        collection[type].push(itemObj);
    }  
};