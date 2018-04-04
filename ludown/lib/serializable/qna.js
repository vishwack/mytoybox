/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
module.exports = class QNA {
    /**
     * @property {qnapair[]} qnaPairs
     */
    /**
     * @property {url[]} urls
     */
    /**
     * @property name
     */
    /**
     * @param qnaPairs
     * @param urls
     * @param name
     */
    constructor({qnaPairs, urls, name} = {}) {
        Object.assign(this, {qnaPairs, urls, name});    
    }
};