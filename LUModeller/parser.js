const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const LUISObjNameEnum = require('./lib/enums/luisobjenum');
const PARSERCONSTS = require('./lib/enums/parserconsts');
const builtInTypes = require('./lib/enums/luisbuiltintypes');
module.exports = {
    /**
     * handle parsing the root file that was passed in command line args
     *
     * @param {string} rootFile Path to the root file passed in command line
     * @param {object} program content flushed out by commander
     */
    handleFile(rootFile, program) {
        // handle root file and subseqntly own calling parse on other files found in rootFile
        var filesToParse = [rootFile];
        var allParsedLUISContent = new Array();
        var allParsedQnAContent = new Array();
        
        // is there an output folder?
        var outFolder = __dirname;
        if(program.out_folder) {
            if(path.isAbsolute(program.out_folder)) {
                outFolder = program.out_folder;
            } else {
                outFolder = path.resolve('', program.out_folder);
            }
            if(!fs.existsSync(outFolder)) {
                process.stdout.write(chalk.red('\nOutput folder ' + outFolder + ' does not exist\n'));
                process.exit(1);
            }
        }
        // get and save the path to root file
        var rootFilePath = __dirname;
        if(path.isAbsolute(rootFile)) {
            rootFilePath = rootFile;
        } else {
            rootFilePath = path.parse(path.resolve('', rootFile)).dir;
        }
        console.log('root file path:' + rootFilePath);
        while(filesToParse.length > 0) {
            var file = filesToParse[0];
            /*if(path.isAbsolute(file)) {
                console.log('Absolute path to:' + file);
            } else {
                console.log('Relative path to:' + file);
                console.log('Absolute path to file:' + path.resolve(file));
            }*/
            if(!fs.existsSync(file)) {
                process.stdout.write(chalk.red('Sorry unable to open [' + file + ']\n'));        
                process.exit(1);
            }
            var fileContent = fs.readFileSync(file,'utf8');
            if (!fileContent) {
                process.stdout.write(chalk.red('Sorry, error reading file:' + file + '\n'));    
                process.exit(1);
            }
            if(!program.quiet) process.stdout.write(chalk.cyan('Parsing file: ' + file + '\n'));
            var parsedContent = parseFile(fileContent, program.quiet);
            if (!parsedContent) {
                process.stdout.write(chalk.red('Sorry, file ' + file + 'had invalid content\n'));
                process.exit(1);
            } else {
                allParsedLUISContent.push(parsedContent.LUISBlob);
                allParsedQnAContent.push(parsedContent.QnABlob);
            }
            // remove this file from the list
            var parentFile = filesToParse.splice(0,1);
            var parentFilePath = path.parse(path.resolve(parentFile[0])).dir;
            console.log('parent absolute file path:' + parentFilePath);
            // add additional files to parse to the list
            if(parsedContent.fParse.length > 0) {
                parsedContent.fParse.forEach(function(file) {
                    if(path.isAbsolute(file)) {
                        filesToParse.push(file);
                    } else {
                        console.log('New file absolute path: ' +  path.resolve(parentFilePath, file));
                        filesToParse.push(path.resolve(parentFilePath, file));
                    }
                });
            }
        }
        var finalLUISJSON = collateLUISFiles(allParsedLUISContent);
        var finalQnAJSON = collateQnAFiles(allParsedQnAContent);
        if(!program.luis_versionId) program.luis_versionId = "0.1";
        if(!program.luis_schema_version) program.luis_schema_version = "2.1.0";
        if(!program.luis_name) program.luis_name = path.basename(rootFile, path.extname(rootFile));
        if(!program.luis_desc) program.luis_desc = "";
        if(!program.luis_culture) program.luis_culture = "en-us";   
        if(!program.qna_name) program.qna_name = path.basename(rootFile, path.extname(rootFile));
        finalLUISJSON.luis_schema_version = program.luis_schema_version;
        finalLUISJSON.versionId = program.luis_versionId;
        finalLUISJSON.name = program.luis_name,
        finalLUISJSON.desc = program.luis_desc;
        finalLUISJSON.culture = program.luis_culture;
        finalQnAJSON.name = program.qna_name;
        
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
                process.stdout.write(chalk.gray('-----------------------------------\n'));
                process.stdout.write(chalk.gray('|         FINAL LUIS JSON         |\n'));
                process.stdout.write(chalk.gray('-----------------------------------\n'));
                process.stdout.write(chalk.gray(JSON.stringify(finalLUISJSON, null, 2) + '\n'));
            }
            if(writeQnAFile) {
                process.stdout.write(chalk.gray('-----------------------------------\n'));
                process.stdout.write(chalk.gray('|         FINAL QnA JSON          |\n'));
                process.stdout.write(chalk.gray('-----------------------------------\n'));
                process.stdout.write(chalk.gray(JSON.stringify(finalQnAJSON, null, 2) + '\n'));
            }
        }
        

        if(!program.lOutFile) program.lOutFile = path.basename(rootFile, path.extname(rootFile)) + "_LUISApp.json";
        if(!program.qOutFile) program.qOutFile = path.basename(rootFile, path.extname(rootFile)) + "_qnaKB.json";
        if(!program.qTSVFile) program.qTSVFile = path.basename(rootFile, path.extname(rootFile)) + "_qnaTSV.tsv"; 
        if(writeLUISFile) {
            // write out the final LUIS Json
            fs.writeFileSync(outFolder + '\\' + program.lOutFile, JSON.stringify(finalLUISJSON, null, 2), function(error) {
                if(error) {
                    process.stdout.write(chalk.red('Unable to write LUIS JSON file - ' + outFolder + '\\' + program.lOutFile + '\n'));
                    process.exit(1);
                } 
            });
            if(!program.quiet) process.stdout.write(chalk.green('Successfully wrote LUIS model to ' + outFolder + '\\' + program.lOutFile + '\n'));
        }

        if(writeQnAFile) {
            // write out the final LUIS Json
            fs.writeFileSync(outFolder + '\\' + program.qOutFile, JSON.stringify(finalQnAJSON, null, 2), function(error) {
                if(error) {
                    process.stdout.write(chalk.red('Unable to write LUIS JSON file - ' + outFolder + '\\' + program.qOutFile + '\n'));
                    process.exit(1);
                } 
            });
            if(!program.quiet) process.stdout.write(chalk.green('Successfully wrote LUIS model to ' + outFolder + '\\' + program.qOutFile + '\n'));

            // write tsv file for QnA maker
            var QnAFileContent = "";
            finalQnAJSON.qnaPairs.forEach(function(QnAPair) {
                QnAFileContent += QnAPair.question + '\t' + QnAPair.answer + '\t Editorial \r\n';
            });
            fs.writeFileSync(outFolder + '\\' + program.qTSVFile, QnAFileContent, function(error) {
                if(error) {
                    process.stdout.write(chalk.red('Unable to write LUIS JSON file - ' + outFolder + '\\' + program.qTSVFile + '\n'));
                    process.exit(1);
                } 
            });
            if(!program.quiet) process.stdout.write(chalk.green('Successfully wrote LUIS model to ' + outFolder + '\\' + program.qTSVFile + '\n'));
        }

        // write luis batch test file if requested
        if(program.write_luis_batch_tests) {
            var LUISBatchFileName = path.basename(rootFile, path.extname(rootFile)) + "_LUISBatchTest.json";
            // write out the final LUIS Json
            fs.writeFileSync(outFolder + '\\' + LUISBatchFileName, JSON.stringify(finalLUISJSON.utterances, null, 2), function(error) {
                if(error) {
                    process.stdout.write(chalk.red('Unable to write LUIS batch test JSON file - ' + outFolder + '\\' + LUISBatchFileName + '\n'));
                    process.exit(1);
                } 
            });
            if(!program.quiet) process.stdout.write(chalk.green('Successfully wrote LUIS batch test JSON file to ' + outFolder + '\\' +  LUISBatchFileName + '\n'));
        }
        // write luis only to stdout
        if(program.gen_luis_only) {
            process.stdout.write(JSON.stringify(finalLUISJSON, null, 2));
            process.exit(0);
        }
        // write qna only to stdout
        if(program.gen_qna_only) {
            process.stdout.write(JSON.stringify(finalQnAJSON, null, 2));
            process.exit(0);
        }
        process.exit(0);
    }
};
/**
 * Main parser code to parse current file contents into LUIS and QNA sections.
 *
 * @param {string} fileContent current file content
 * @param {boolean} log indicates if we need verbose logging.
 *  
 * @returns {additionalFilesToParse,LUISJsonStruct,qnaJsonStruct} Object that contains list of additional files to parse, parsed LUIS object and parsed QnA object
 */
var parseFile = function(fileContent, log) 
{
    var additionalFilesToParse = new Array();
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
    };
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
                                        if(!log) process.stdout.write(chalk.yellow('WARN: No labelled value found for entity: ' + entity + ' in utterance: ' + utterance + '\n'));
                                    }
                                } else {
                                    if(!log)  process.stdout.write(chalk.yellow('WARN: Entity ' + entity + ' in utterance: "' + utterance + '" is missing labelled value \n'));
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
                    process.stdout.write(chalk.red('ERROR: No parser decoration found. Sections need to start with # or $ or ? or #ref or #url\n'));
                    process.stdout.write(chalk.red(chunk.toString() + '\n'));
                    process.exit(1);
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


/**
 * Helper function to add an item to collection if it does not exist
 *
 * @param {object} collection contents of the current collection
 * @param {LUISObjNameEnum} type item type
 * @param {object} value value of the current item to examine and add
 *  
 */
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

/**
 * Handle collating all QnA sections across all parsed files into one QnA collection
 *
 * @param {object} parsedBlobs Contents of all parsed file blobs
 * 
 * @returns {FinalQnAJSON} Final qna json contents
 */
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
};

/**
 * Handle collating all LUIS sections across all parsed files into one LUIS collection
 *
 * @param {object} parsedBlobs Contents of all parsed file blobs
 * 
 * @returns {FinalLUISJSON} Final qna json contents
 */
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
};

/**
 * Helper function to merge item if it does not already exist
 *
 * @param {object} blob Contents of all parsed file blobs
 * @param {object} finalCollection reference to the final collection of items
 * @param {LUISObjNameEnum} type enum type of possible LUIS object types
 * 
 */
var mergeResults = function(blob, finalCollection, type) {
    if(blob[type].length > 0) {
        blob[type].forEach(function(blobItem){
            // add if this item if it does not already exist in final collection
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
};

/**
 * Helper function to examine type of content in the current buffer and provide validation errors based on content type
 *
 * @param {string} previousSection Contents of of the prior section being parsed
 * @param {string[]} sectionsInFile array of strings of prior sections parsed in current file
 * @param {PARSERCONSTS} currentSectionType type of current section parsed
 * @param {int} lineIndex current line index being parsed
 * 
 * @returns {string[]} updated sections in current file being parsed.
 */
var validateAndPushCurrentBuffer = function(previousSection, sectionsInFile, currentSectionType, lineIndex) {
    switch(currentSectionType) {
        case PARSERCONSTS.INTENT:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                process.stdout.write(chalk.yellow(lineIndex + ': [WARN] No utterances found for intent: ' + previousSection.split(/\r\n/)[0] + '\n'));
            }
            sectionsInFile.push(previousSection);
            break;
        case PARSERCONSTS.QNA:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                process.stdout.write(chalk.yellow(lineIndex + ': [WARN] No answer found for question' + previousSection.split(/\r\n/)[0] + '\n'));
            }
            sectionsInFile.push(previousSection);
            break;
        case PARSERCONSTS.ENTITY:
            // warn if there isnt at least one utterance in an intent
            if(previousSection.split(/\r\n/).length === 1)  {
                process.stdout.write(chalk.yellow(lineIndex + ': [WARN] No list entity definition found for entity:' + previousSection.split(/\r\n/)[0] + '\n'));
            }
            sectionsInFile.push(previousSection);
            break;
        default:
            sectionsInFile.push(previousSection);
    }
    return sectionsInFile;
};

/**
 * Helper function to split current file content by sections. Each section needs a parser delimiter
 *
 * @param {string} fileContent string content of current file being parsed
 * 
 * @returns {string[]} List of parsed LUIS/ QnA sections in current file
 */
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
            if(currentLine.toLowerCase().includes(':list') || currentLine.toLowerCase().includes(':phraselist')){
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
                process.stdout.write(chalk.red('Error: Line ' + lineIndex + ' is not part of a Intent/ Entity/ QnA \n'));
                process.stdout.write(chalk.red('Stopping further processing.\n'));
                process.exit(1);
            }
        }
    }
    // handle anything in currentSection buffer
    if(currentSection !== null) {
        var previousSection = currentSection.substring(0, currentSection.lastIndexOf("\r\n"));
        sectionsInFile = validateAndPushCurrentBuffer(previousSection, sectionsInFile, currentSectionType, lineIndex);
    }
    return sectionsInFile;
};