module.exports = class LUIS {
    /**
     * @property {intent[]} intents
     */
    /**
     * @property {entity[]} entities
     */
    /**
     * @property {composite[]} composites
     */
    /**
     * @property {closedList[]} closedLists
     */
    /**
     * @property {string[]} bing_entities
     */
    /**
     * @property {modelFeature[]} model_features
     */
    /**
     * @property {regex_feature[]} regex_features
     */
    /**
     * @property {utterance[]} utterances
     */
    /**
     * @property {pattern[]} patterns
     */
    /**
     * @property {patternAnyEntity[]} patternAnyEntities
     */
    /**
     * @property {prebuiltEntity[]} prebuiltEntities
     */
    /**
     * @property luis_schema_version
     */
    /**
     * @property versionId
     */
    /** 
     * @property name
     */
    /**
     * @property desc
     */
    /**
     * @property culture
     */
    /**
     *
     * @param intents
     * @param entities
     * @param composites
     * @param closedLists
     * @param bing_entities
     * @param model_features
     * @param regex_features
     * @param utterances
     * @param patterns
     * @param patternAnyEntities
     * @param prebuiltEntities
     * @param luis_schema_version
     * @param versionId
     * @param name
     * @param desc
     * @param culture
     */
    constructor({intents, entities, composites, closedLists, bing_entities, model_features, 
                 regex_features, utterances, patterns, patternAnyEntities, prebuiltEntities, luis_schema_version  = '2.1.0',
                 versionId = '0.1', name, desc, culture } = {}) {
        Object.assign(this, {intents, entities, composites, closedLists, bing_entities, model_features, 
            regex_features, utterances, patterns, patternAnyEntities, prebuiltEntities, luis_schema_version,
            versionId, name, desc, culture });
    }
}; 