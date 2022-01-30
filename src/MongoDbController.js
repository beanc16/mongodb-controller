const MongoDbConnection = require("./MongoDbConnection");
const MongoDbControllerHelpers = require("./MongoDbControllerHelpers");



class MongoDbController
{
    // Static variables
    static mongoUri;
    static dbName;
    static collectionName;
    static findParams = {};
    static sortOptions = {};
    static Model;
    static _connection = new MongoDbConnection({
        dbName: this.dbName,
        uri: this.mongoUri,
    });



    /* 
     * GETS
     */

    static async getAll(findParams = this.findParams)
    {
        return new Promise((resolve, reject) =>
        {
            MongoDbControllerHelpers.validateStaticVariables({
                collectionName: this.collectionName,
                Model: this.Model,
                controllerName: this.name,
            })
            .then(() =>
            {
                console.info("Querying resources from database...");
    
                MongoDbControllerHelpers.queryResources({
                    connection: this._connection,
                    findParams,
                    collectionName: this.collectionName,
                    sortOptions: this.sortOptions,
                    Model: this.Model,
                })
                .then(function (mongoResults)
                {
                    console.info("Successfully queried resources from database.");
                    resolve(mongoResults);
                })
                .catch(function (errResults)
                {
                    console.error("Failed to query resources from database:", errResults);
                    reject(errResults);
                });
            })
            .catch(function (errors)
            {
                reject(errors);
            });
        });
    }

    static async getMostRecent(findParams = this.findParams)
    {
        return new Promise((resolve, reject) =>
        {
            MongoDbControllerHelpers.validateStaticVariables({
                collectionName: this.collectionName,
                Model: this.Model,
                controllerName: this.name,
            })
            .then(() =>
            {
                MongoDbControllerHelpers.queryResource({
                    connection: this._connection,
                    findParams,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((mongoResults) =>
                {
                    if (mongoResults && mongoResults.results)
                    {
                        console.info("Successfully queried resources from database.");
                        resolve(mongoResults.results);
                    }
    
                    else
                    {
                        console.error(
                            "Successfully queried resources from " + 
                            "database, but an unknown error " + 
                            "occurred while parsing the results."
                        );
    
                        reject(`An unknown error occurred in ` + 
                               `${this.name}.getMostRecent()`);
                    }
                })
                .catch(function (errResults)
                {
                    console.error("Failed to query resources from database:", errResults);
                    resolve(errResults);
                });
            })
            .catch(function (errors)
            {
                reject(errors);
            });
        });
    }



    /* 
     * POSTS
     */

    static async insertOne(obj)
    {
        return new Promise((resolve, reject) =>
        {
            MongoDbControllerHelpers.validateStaticVariables({
                collectionName: this.collectionName,
                Model: this.Model,
                controllerName: this.name,
            })
            .then(() =>
            {
                console.info(`Inserting one ${this.Model.name} into database...`);
    
                MongoDbControllerHelpers.insertOne({
                    connection: this._connection,
                    obj,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    console.info(`Successfully inserted one ${this.Model.name} into database.`);
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    console.error(`Failed to insert one ${this.Model.name} into database:`, errResults);
                    reject(errResults);
                });
            })
            .catch(function (errors)
            {
                reject(errors);
            });
        });
    }



    /* 
     * PATCHES
     */

    static async findOneAndUpdate(findParams = this.findParams, obj)
    {
        return new Promise((resolve, reject) =>
        {
            MongoDbControllerHelpers.validateStaticVariables({
                collectionName: this.collectionName,
                Model: this.Model,
                controllerName: this.name,
            })
            .then(() =>
            {
                console.info(`Updating one ${this.Model.name} in database...`);
    
                MongoDbControllerHelpers.findOneAndUpdate({
                    connection: this._connection,
                    findParams,
                    obj,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    console.info(`Successfully updated one ${this.Model.name} in database.`);
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    console.error(`Failed to update one ${this.Model.name} in database:`, errResults);
                    reject(errResults);
                });
            })
            .catch(function (errors)
            {
                reject(errors);
            });
        });
    }



    /* 
     * DELETES
     */

    static async findOneAndDelete(findParams)
    {
        return new Promise((resolve, reject) =>
        {
            MongoDbControllerHelpers.validateStaticVariables({
                collectionName: this.collectionName,
                Model: this.Model,
                controllerName: this.name,
            })
            .then(() =>
            {
                console.info(`Deleting one ${this.Model.name} from database...`);
    
                MongoDbControllerHelpers.findOneAndDelete({
                    connection: this._connection,
                    findParams,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    console.info(`Successfully deleted one ${this.Model.name} from database.`);
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    console.error(`Failed to delete one ${this.Model.name} from database:`, errResults);
                    reject(errResults);
                });
            })
            .catch(function (errors)
            {
                reject(errors);
            });
        });
    }
}





module.exports = MongoDbController;
