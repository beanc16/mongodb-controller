import { UUID } from 'node:crypto';

import { AnyBulkWriteOperation, Document, ObjectId, WithId } from 'mongodb';

import { MongoDbResults } from './MongoDbResults.js';
import {
    CollectionNameNotSetError,
    EmptyResultError,
    ModelNotSetError,
    ModelIsInvalidError,
} from './errors/index.js';
import { DocumentAlreadyExistsError } from './errors/DocumentAlreadyExistsError.js';
import {
    FindParams,
    InstanceOfModel,
    Model,
    MongoDbControllerHelpersAggregateParameters,
    MongoDbControllerHelpersBulkWriteParameters,
    MongoDbControllerHelpersFindOneAndDeleteParameters,
    MongoDbControllerHelpersFindOneAndUpdateParameters,
    MongoDbControllerHelpersInsertOneIfNotExistsParameters,
    MongoDbControllerHelpersInsertOneParameters,
    MongoDbControllerHelpersQueryResourceParameters,
    MongoDbControllerHelpersQueryResourcesParameters,
    WithErrors,
} from './types.js';



export class MongoDbControllerHelpers
{
    /* 
     * GETS
     */
    
    static async queryResources({
        connection,
        findParams,
        projectionParams,
        collectionName,
        dbName,
        sortOptions,
        Model,
    }: MongoDbControllerHelpersQueryResourcesParameters): Promise<MongoDbResults>
    {
        return new Promise(function (resolve, reject)
        {
            findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                // Make query
                const result = await collection.find(findParams, { projection: projectionParams })
                                                .sort(sortOptions);
                const array = await result.toArray();

                // Empty results
                if (array.length === 0)
                {
                    //throw new EmptyResultsError(Model.name);
                }
                
                // Parse array into an array of models
                const models = MongoDbControllerHelpers.getAsModels(array, Model);
                
                // Initialize results
                const mongoResults = new MongoDbResults({ results: models });
                resolve(mongoResults);
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }

    static async queryResource({
        connection,
        findParams,
        projectionParams,
        collectionName,
        dbName,
        Model,
        closeConnectionWhenDone = true,
    }: MongoDbControllerHelpersQueryResourceParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                // Make query
                const result = await collection.findOne(findParams, { projection: projectionParams });

                // Failed query (only happens in findOne)
                if (!result)
                {
                    //throw new EmptyResultError(Model.name);
                    resolve(new MongoDbResults());  // No results found
                }

                // Did not fail query
                else
                {
                    // Parse into model
                    const model = MongoDbControllerHelpers.getAsModel(result, Model);
                    
                    // Initialize results
                    const mongoResults = new MongoDbResults({ results: model });
                    resolve(mongoResults);
                }
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                if (closeConnectionWhenDone !== false)
                {
                    await connection.close({ guid });
                }
            });
        });
    }
    
    static async aggregate({
        connection,
        aggregateArrayOptions,
        collectionName,
        dbName,
        sortOptions,
        Model,
    }: MongoDbControllerHelpersAggregateParameters): Promise<MongoDbResults>
    {
        return new Promise(function (resolve, reject)
        {
            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                if (sortOptions && Object.keys(sortOptions).length > 0)
                {
                    aggregateArrayOptions.push({ "$sort": sortOptions });
                }

                // Make query
                const result = await collection.aggregate(aggregateArrayOptions);
                const array = await result.toArray();

                // Empty results
                if (array.length === 0)
                {
                    //throw new EmptyResultsError(Model.name);
                }
                
                // Parse array into an array of models
                const models = MongoDbControllerHelpers.getAsModels(array, Model);
                
                // Initialize results
                const mongoResults = new MongoDbResults({ results: models });
                resolve(mongoResults);
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }

    static getAsModels(array: WithId<Document>[] | Document[], Model: Model): InstanceOfModel[]
    {
        const models: InstanceOfModel[] = [];

        for (let i = 0; i < array.length; i++)
        {
            const model = MongoDbControllerHelpers.getAsModel(array[i], Model);
            models.push(model);
        }
        
        return models;
    }

    static getAsModel(document: WithId<Document> | Document, Model: Model): InstanceOfModel
    {
        return new Model(document);
    }



    /* 
     * POSTS
     */

    static async insertOne({
        connection,
        obj,
        collectionName,
        dbName,
        Model,
    }: MongoDbControllerHelpersInsertOneParameters): Promise<InstanceOfModel>
    {
        return new Promise((resolve, reject) =>
        {
            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                obj = MongoDbControllerHelpers.convertIdToObjectId(obj);

                // Make query
                const model = MongoDbControllerHelpers.getAsModel(obj, Model);

                // Validation is successful or there is no validation
                if (!model.isValid || model.isValid())
                {
                    // Insert
                    await collection.insertOne(model);

                    // Return the model
                    resolve(model);
                }
                else
                {
                    throw new ModelIsInvalidError(Model.name);
                }
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }

    static async insertOneIfNotExists({
        connection,
        findParams,
        obj,
        collectionName,
        dbName,
        Model,
    }: MongoDbControllerHelpersInsertOneIfNotExistsParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                obj = MongoDbControllerHelpers.convertIdToObjectId(obj);

                // Make query
                const model = MongoDbControllerHelpers.getAsModel(obj, Model);

                // Validation is successful or there is no validation
                if (!model.isValid || model.isValid())
                {
                    // Insert (if findParams does not exist)
                    const result = await collection.updateOne(findParams, {
                        "$setOnInsert": model,
                    }, {
                        upsert: true,
                    });

                    // Successfully inserted (if findParams does not exist)
                    if (result.upsertedCount > 0)
                    {
                        // Add the ID to the model
                        const newModel = MongoDbControllerHelpers.getAsModel({
                            _id: result.upsertedId,
                            ...model,
                        }, Model);

                        const results = new MongoDbResults({
                            results: {
                                model: newModel,
                                result,
                            },
                        });

                        // Return the model
                        resolve(results);
                    }

                    // Failed to insert (if findParams does exist)
                    else
                    {
                        throw new DocumentAlreadyExistsError(Model.name, "inserted");
                    }
                }
                else
                {
                    throw new ModelIsInvalidError(Model.name);
                }
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }



    /* 
     * PATCHES
     */

    static async findOneAndUpdate({
        connection,
        findParams,
        obj,
        operator,
        arrayFilters,
        collectionName,
        dbName,
        Model,
    }: MongoDbControllerHelpersFindOneAndUpdateParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

                // Make query
                const validationModel = MongoDbControllerHelpers.getAsModel(obj, Model);

                // Validation is successful or there is no validation
                if (!validationModel.isValid || validationModel.isValid())
                {
                    // Get the pre-update version of the Model
                    const oldModelResponse = await MongoDbControllerHelpers.queryResource({
                        connection,
                        findParams,
                        // projectionParams,
                        collectionName,
                        dbName,
                        Model,
                        closeConnectionWhenDone: false,
                    });

                    // What to do with the given object
                    const operationOnObj: Record<string, FindParams> = {};
                    operationOnObj[`$${operator}`] = obj;

                    // Update (replace the given values for the obj)
                    const result = await collection.findOneAndUpdate(findParams, operationOnObj, {
                        arrayFilters,
                        returnDocument: "after",    // Get the updated version of the document
                    });

                    // Failed query (only happens in findOne)
                    if (!result || !result.value)
                    {
                        throw new EmptyResultError(Model.name);
                    }
                    
                    // Parse the updated document into the Model
                    const newModel = MongoDbControllerHelpers.getAsModel(result.value, Model);
                    
                    // Initialize results
                    const mongoResults = new MongoDbResults({
                        results: {
                            old: oldModelResponse.results,
                            new: newModel,
                        } 
                    });
                    resolve(mongoResults);
                }
                else
                {
                    throw new ModelIsInvalidError(Model.name);
                }
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }



    /* 
     * DELETES
     */

    static async findOneAndDelete({
        connection,
        findParams,
        collectionName,
        dbName,
        Model,
    }: MongoDbControllerHelpersFindOneAndDeleteParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

                // Delete
                const result = await collection.findOneAndDelete(findParams);

                // Failed query (only happens in findOne)
                if (!result || !result.value)
                {
                    throw new EmptyResultError(Model.name);
                }
                
                // Parse into model
                const model = MongoDbControllerHelpers.getAsModel(result.value, Model);
                
                // Initialize results
                const mongoResults = new MongoDbResults({ results: model });
                resolve(mongoResults);
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }



    /* 
     * MULTI-OPERATION
     */

    static async bulkWrite({
        connection,
        collectionName,
        dbName,
        operations,
    }: MongoDbControllerHelpersBulkWriteParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            const [{ Model }] = operations;

            let guid: UUID;
            connection.getCollection({ collectionName, dbName })
            .then(async ({ collection, auditLogGuid }) =>
            {
                guid = auditLogGuid;

                // Data setup
                const failedOperations: (MongoDbControllerHelpersBulkWriteParameters['operations'][0] & WithErrors)[] = [];

                // Type guard doesn't work in reduce for some reason, so .filter later
                const updateFindParams: FindParams[] = [];
                const parameters = operations.map<AnyBulkWriteOperation<Document> | undefined>((operation) => {
                    let findParams: FindParams;
                    let validationModel: InstanceOfModel;

                    switch (operation.type)
                    {
                        case 'insert':
                            validationModel = MongoDbControllerHelpers.getAsModel(operation.obj, operation.Model);

                            // Validation is successful or there is no validation
                            if (!validationModel.isValid || validationModel.isValid())
                            {
                                return {
                                    insertOne: {
                                        document: operation.obj,
                                    },
                                };
                            }

                            failedOperations.push({
                                ...operation,
                                errors: [
                                    new ModelIsInvalidError(operation.Model.name),
                                ],
                            });
                            return undefined;
                        case 'update':
                            findParams = MongoDbControllerHelpers.convertIdToObjectId(operation.findParams);
                            validationModel = MongoDbControllerHelpers.getAsModel(operation.obj, operation.Model);

                            // Validation is successful or there is no validation
                            if (!validationModel.isValid || validationModel.isValid())
                            {
                                updateFindParams.push(findParams);
                                return {
                                    updateOne: {
                                        filter: findParams,
                                        update: {
                                            [`$${operation.operator}`]: operation.obj,
                                        },
                                        arrayFilters: operation.arrayFilters,
                                    },
                                };
                            }

                            failedOperations.push({
                                ...operation,
                                errors: [
                                    new ModelIsInvalidError(operation.Model.name),
                                ],
                            });
                            return undefined;
                        case 'delete':
                            findParams = MongoDbControllerHelpers.convertIdToObjectId(operation.findParams);
                            return {
                                deleteOne: {
                                    filter: findParams,
                                },
                            };
                    }
                }).filter((parameter) => parameter !== undefined);

                // Run bulk db operations
                const result = await collection.bulkWrite(parameters);

                // Set post-write ids
                const postWriteInsertedIds: ObjectId[] = result.getInsertedIds().map(({ _id }) => _id);
                const postWriteUpsertedIds: ObjectId[] = result.getUpsertedIds().map(({ _id }) => _id);

                // Set post-write parameters
                const postWriteFindParams = [
                    ...postWriteInsertedIds,
                    ...postWriteUpsertedIds,
                ].reduce<{
                    "$or": ({
                        _id: ObjectId,
                    } | FindParams)[],
                }>((acc, id) => {
                    acc['$or'].push({
                        _id: id,
                    });
                    return acc;
                }, {
                    "$or": [...updateFindParams],
                });

                // Query for post-operation results
                const postWriteResults = await collection.find(postWriteFindParams);
                const array = await postWriteResults.toArray();

                // Parse array into an array of models
                const models = MongoDbControllerHelpers.getAsModels(array, Model);

                // Initialize results
                const mongoResults = new MongoDbResults({
                    results: models,
                });
                resolve(mongoResults);
            })
            .catch((err) =>
            {
                const errResults = new MongoDbResults({ error: err, statusCode: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close({ guid });
            });
        });
    }



    /* 
     * UTILITY
     */

    static validateStaticVariables({
        collectionName,
        Model,
        controllerName,
    }: {
        collectionName: string;
        Model: Model;
        controllerName: string;
    }): Promise<boolean>
    {
        return new Promise((resolve, reject) =>
        {
            console.debug(`Validating ${controllerName} static variables...`);

            const errors = [];

            if (!collectionName)
            {
                errors.push(new CollectionNameNotSetError(collectionName));
            }

            if (!Model)
            {
                errors.push(new ModelNotSetError(controllerName));
            }

            if (errors.length > 0)
            {
                console.error(`${controllerName} static variable validation failed.`);
                reject(errors);
            }

            console.debug(`${controllerName} static variable validation succeeded.`);
            resolve(true);
        });
    }

    static convertIdToObjectId(findParams: FindParams): FindParams
    {
        if (findParams && findParams._id)
        {
            findParams._id = new ObjectId(findParams._id);
        }
        
        else if (findParams && findParams.id)
        {
            findParams._id = new ObjectId(findParams.id);
            delete findParams.id;
        }

        return findParams;
    }

    static addFieldsFromOneModelToOther<ModelToMap = Model>({ to, from }: {
        to: ModelToMap;
        from: ModelToMap;
    })
    {
        return Object.assign({}, from, to);
    }
}
