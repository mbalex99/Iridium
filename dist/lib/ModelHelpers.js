"use strict";
const MongoDB = require("mongodb");
const Skmatc = require("skmatc");
const Omnom_1 = require("./utils/Omnom");
const _ = require("lodash");
/**
 * A number of helper methods used commonly within Iridium, they provide a means to transform,
 * validate, wrap and diff instances and documents. By keeping these methods in one place we
 * help to improve testability and reduce code duplication (mouse abuse) throughout the codebase.
 * @internal
 */
class ModelHelpers {
    constructor(model) {
        this.model = model;
        this._validator = Skmatc.scope(model.schema);
        model.validators.forEach(validator => this._validator.register(validator));
    }
    /**
     * Validates a document to ensure that it matches the model's ISchema requirements
     * @param {any} document The document to validate against the ISchema
     * @returns {SkmatcCore.IResult} The result of the validation
     */
    validate(document) {
        return this._validator.validate(document);
    }
    /**
     * Wraps the given document in an instance wrapper for use throughout the application
     * @param {any} document The document to be wrapped as an instance
     * @param {Boolean} isNew Whether the instance originated from the database or was created by the application
     * @param {Boolean} isPartial Whether the document supplied contains all information present in the database
     * @returns {any} An instance which wraps this document
     */
    wrapDocument(document, isNew, isPartial) {
        return new this.model.Instance(document, isNew, isPartial);
    }
    /**
     * Converts the given document to its database form into a form
     * using the transforms defined on the model.
     * @param {any} document The document to be converted
     * @returns {any} The result of having transformed the document.
     * @remarks This is only really called from insert/create - as
     */
    transformToDB(document, options = { properties: true }) {
        if (options.document && this.model.transforms.$document)
            document = this.model.transforms.$document.toDB(document, "$document", this.model);
        if (!options.properties)
            return document;
        for (let property in this.model.transforms)
            if (property === "$document")
                continue;
            else if (document.hasOwnProperty(property)) {
                document[property] = this.model.transforms[property].toDB(document[property], property, this.model);
            }
        return document;
    }
    /**
     * Converts the given document from its database form using the
     * transforms defined on the model.
     * @param document The document to be converted.
     * @returns The result of having transformed the document.
     * @remarks Unlike the transformToDB function - this method only applies
     * document level transforms, as property level transforms are applied in
     * their relevant instance setters.
     */
    transformFromDB(document, options = { properties: true }) {
        if (options.document && this.model.transforms.$document)
            document = this.model.transforms.$document.fromDB(document, "$document", this.model);
        if (!options.properties)
            return document;
        for (let property in this.model.transforms)
            if (property === "$document")
                continue;
            else if (document.hasOwnProperty(property)) {
                document[property] = this.model.transforms[property].fromDB(document[property], property, this.model);
            }
        return document;
    }
    /**
     * Converts the given document to its database form into a form
     * using the transforms defined on the model.
     * @param document The document to be converted
     * @param processProperties Whether or not to process properties in addition
     * document level transforms.
     * @returns {any} A new document cloned from the original and transformed
     */
    convertToDB(document, options = { properties: true }) {
        let doc = this.cloneDocument(document);
        return this.transformToDB(doc, options);
    }
    /**
     * Performs a diff operation between two documents and creates a MongoDB changes object to represent the differences
     * @param {any} original The original document prior to changes being made
     * @param {any} modified The document after changes were made
     */
    diff(original, modified) {
        let omnom = new Omnom_1.Omnom();
        omnom.diff(original, modified);
        return omnom.changes;
    }
    /**
     * Clones the given document recursively, taking into account complex types like
     * Buffers correctly.
     *
     * @param {any} The document you wish to clone deeply.
     */
    cloneDocument(original) {
        return _.cloneDeepWith(original, (value) => {
            if (Buffer.isBuffer(value)) {
                return value;
            }
            if (value instanceof MongoDB.Binary) {
                return value;
            }
            if (value instanceof MongoDB.ObjectID) {
                return value;
            }
        });
    }
    /**
     * Clones the given document recursively, taking into account complex types like
     * Buffers correctly. Optimized for working with query documents instead of true
     * documents.
     *
     * @param {any} The document you wish to clone deeply.
     */
    cloneConditions(original) {
        return this.cloneDocument(original);
    }
}
exports.ModelHelpers = ModelHelpers;

//# sourceMappingURL=ModelHelpers.js.map
