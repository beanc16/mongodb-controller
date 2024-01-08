const { ObjectId } = require("mongodb");
const MongoDbResults = require("./MongoDbResults");
const {
    CollectionNameNotSetError,
    EmptyResultError,
    ModelNotSetError,
    ModelIsInvalidError,
} = require("./errors");
const DocumentAlreadyExistsError = require("./errors/DocumentAlreadyExistsError");



class MongoDbControllerHelpers
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
    })
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
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
    })
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
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
    })
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(async () =>
            {
                await connection.close();
            });
        });
    }

    static getAsModels(array, Model)
    {
        const models = [];

        for (let i = 0; i < array.length; i++)
        {
            const model = MongoDbControllerHelpers.getAsModel(array[i], Model);
            models.push(model);
        }
        
        return models;
    }

    static getAsModel(document, Model)
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
    })
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
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
    })
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
    })
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
                        //projectionParams,
                        collectionName,
                        Model,
                        closeConnectionWhenDone: false,
                    });

                    // What to do with the given object
                    const operationOnObj = {};
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
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
    })
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
                const errResults = new MongoDbResults({ error: err, status: 500 });
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
    })
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

    static convertIdToObjectId(findParams)
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

    static addFieldsFromOneModelToOther({ to, from })
    {
        return Object.assign({}, from, to);
    }
}





module.exports = MongoDbControllerHelpers;
