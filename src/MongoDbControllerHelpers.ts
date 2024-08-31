import { Document, ObjectId, WithId } from 'mongodb';
import { MongoDbResults } from './MongoDbResults.js';
import {
    CollectionNameNotSetError,
    EmptyResultError,
    ModelNotSetError,
    ModelIsInvalidError,
} from './errors/index.js';
import { DocumentAlreadyExistsError } from './errors/DocumentAlreadyExistsError.js';
import { MongoDbConnection } from './MongoDbConnection.js';
import { ArrayFilters, FindParams, InstanceOfModel, Model, ProjectionParams, SortOptions } from './types.js';
import { AggregateArrayOptions } from './types.js';



interface BaseMongoDbControllerHelpersParameters
{
    connection: MongoDbConnection;
    collectionName: string;
    Model: Model;
}

interface MongoDbControllerHelpersQueryResourcesParameters extends BaseMongoDbControllerHelpersParameters
{
    findParams: FindParams;
    projectionParams: ProjectionParams;
    sortOptions: SortOptions;
}

interface MongoDbControllerHelpersQueryResourceParameters extends BaseMongoDbControllerHelpersParameters {
    findParams: FindParams;
    projectionParams?: ProjectionParams;
    closeConnectionWhenDone?: boolean;
}

interface MongoDbControllerHelpersAggregateParameters extends BaseMongoDbControllerHelpersParameters {
    aggregateArrayOptions: AggregateArrayOptions;
    sortOptions: SortOptions;
}

interface MongoDbControllerHelpersInsertOneParameters extends BaseMongoDbControllerHelpersParameters
{
    obj: Document;
}

interface MongoDbControllerHelpersInsertOneIfNotExistsParameters extends MongoDbControllerHelpersInsertOneParameters
{
    findParams: FindParams;
}

interface MongoDbControllerHelpersFindOneAndUpdateParameters extends MongoDbControllerHelpersInsertOneIfNotExistsParameters
{
    operator: string; // TODO: Make this an enum later
    arrayFilters: ArrayFilters;
}

interface MongoDbControllerHelpersFindOneAndDeleteParameters extends BaseMongoDbControllerHelpersParameters
{
    findParams: FindParams;
}

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
        sortOptions,
        Model,
    }: MongoDbControllerHelpersQueryResourcesParameters): Promise<MongoDbResults>
    {
        return new Promise(function (resolve, reject)
        {
            findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
            });
        });
    }

    static async queryResource({
        connection,
        findParams,
        projectionParams,
        collectionName,
        Model,
        closeConnectionWhenDone = true,
    }: MongoDbControllerHelpersQueryResourceParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            findParams = MongoDbControllerHelpers.convertIdToObjectId(findParams);

            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                    await connection.close();
                }
            });
        });
    }
    
    static async aggregate({
        connection,
        aggregateArrayOptions,
        collectionName,
        sortOptions,
        Model,
    }: MongoDbControllerHelpersAggregateParameters): Promise<MongoDbResults>
    {
        return new Promise(function (resolve, reject)
        {
            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
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
        Model,
    }: MongoDbControllerHelpersInsertOneParameters): Promise<InstanceOfModel>
    {
        return new Promise((resolve, reject) =>
        {
            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
            });
        });
    }

    static async insertOneIfNotExists({
        connection,
        findParams,
        obj,
        collectionName,
        Model,
    }: MongoDbControllerHelpersInsertOneIfNotExistsParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
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
        Model,
    }: MongoDbControllerHelpersFindOneAndUpdateParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
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
        Model,
    }: MongoDbControllerHelpersFindOneAndDeleteParameters): Promise<MongoDbResults>
    {
        return new Promise((resolve, reject) =>
        {
            connection.getCollection({ collectionName })
            .then(async (collection) =>
            {
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
                await connection.close();
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
