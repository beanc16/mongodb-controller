const { ObjectId } = require("mongodb");
const MongoResults = require("./MongoResults");
const {
    CollectionNameNotSetError,
    EmptyResultError,
    EmptyResultsError,
    ModelNotSetError,
    ModelIsInvalidError,
} = require("./errors");



class MongoControllerHelpers
{
    /* 
     * GETS
     */
    
    static async queryResources({
        connection,
        findParams,
        collectionName,
        sortOptions,
        Model,
    })
    {
        return new Promise(function (resolve, reject)
        {
            findParams = MongoControllerHelpers.convertIdToObjectId(findParams);

            connection.getCollection({ collectionName })
            .then(async function (collection)
            {
                // Make query
                const result = await collection.find(findParams)
                                               .sort(sortOptions);
                const array = await result.toArray();

                // Empty results
                if (array.length === 0)
                {
                    throw new EmptyResultsError(Model.name);
                }
                
                // Parse array into an array of models
                const models = MongoControllerHelpers.getAsModels(array, Model);
                
                // Initialize results
                const mongoResults = new MongoResults({ results: models });
                resolve(mongoResults);
            })
            .catch(function (err)
            {
                const errResults = new MongoResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(function ()
            {
                await connection.close();
            });
        });
    }

    static async queryResource({
        connection,
        findParams,
        collectionName,
        Model,
    })
    {
        return new Promise(function (resolve, reject)
        {
            findParams = MongoControllerHelpers.convertIdToObjectId(findParams);

            connection.getCollection({ collectionName })
            .then(async function (collection)
            {
                // Make query
                const result = await collection.findOne(findParams);

                // Failed query (only happens in findOne)
                if (!result)
                {
                    throw new EmptyResultError(Model.name);
                }
                
                // Parse into model
                const model = MongoControllerHelpers.getAsModel(result, Model);
                
                // Initialize results
                const mongoResults = new MongoResults({ results: model });
                resolve(mongoResults);
            })
            .catch(function (err)
            {
                const errResults = new MongoResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(function ()
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
            const model = MongoControllerHelpers.getAsModel(array[i], Model);
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
        return new Promise(function (resolve, reject)
        {
            connection.getCollection({ collectionName })
            .then(async function (collection)
            {
                obj = MongoControllerHelpers.convertIdToObjectId(obj);

                // Make query
                const model = MongoControllerHelpers.getAsModel(obj, Model);

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
                    throw new ModelIsInvalidError();
                }
            })
            .catch(function (err)
            {
                const errResults = new MongoResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(function ()
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
        collectionName,
        Model,
    })
    {
        return new Promise(function (resolve, reject)
        {
            connection.getCollection({ collectionName })
            .then(async function (collection)
            {
                findParams = MongoControllerHelpers.convertIdToObjectId(findParams);

                // Make query
                const validationModel = MongoControllerHelpers.getAsModel(obj, Model);

                // Validation is successful or there is no validation
                if (!validationModel.isValid || validationModel.isValid())
                {
                    // Update (replace the given values for the obj)
                    const result = await collection.findOneAndUpdate(findParams, {
                        $set: obj,
                    });

                    // Failed query (only happens in findOne)
                    if (!result || !result.value)
                    {
                        throw new EmptyResultError(Model.name);
                    }
                    
                    // Parse into model
                    const oldModel = MongoControllerHelpers.getAsModel(result.value, Model);

                    // Add any fields to newModel that weren't changed for output
                    const newModel = MongoControllerHelpers.addFieldsFromOneModelToOther({
                        to: obj,
                        from: oldModel,
                    });
                    
                    // Initialize results
                    const mongoResults = new MongoResults({
                        results: {
                            old: oldModel,
                            new: newModel,
                        } 
                    });
                    resolve(mongoResults);
                }
                else
                {
                    throw new ModelIsInvalidError();
                }
            })
            .catch(function (err)
            {
                const errResults = new MongoResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(function ()
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
        return new Promise(function (resolve, reject)
        {
            connection.getCollection({ collectionName })
            .then(async function (collection)
            {
                findParams = MongoControllerHelpers.convertIdToObjectId(findParams);

                // Delete
                const result = await collection.findOneAndDelete(findParams);

                // Failed query (only happens in findOne)
                if (!result || !result.value)
                {
                    throw new EmptyResultError(Model.name);
                }
                
                // Parse into model
                const model = MongoControllerHelpers.getAsModel(result.value, Model);
                
                // Initialize results
                const mongoResults = new MongoResults({ results: model });
                resolve(mongoResults);
            })
            .catch(function (err)
            {
                const errResults = new MongoResults({ error: err, status: 500 });
                reject(errResults);
            })
            .finally(function ()
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
        return new Promise(function (resolve, reject)
        {
            console.debug(`Validating ${controllerName} static variables...`);

            const errors = [];

            if (!collectionName)
            {
                errors.push(new CollectionNameNotSetError());
            }

            if (!Model)
            {
                errors.push(new ModelNotSetError());
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





module.exports = MongoControllerHelpers;
