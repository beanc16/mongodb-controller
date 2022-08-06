const MongoDbConnection = require("./MongoDbConnection");
const MongoDbControllerHelpers = require("./MongoDbControllerHelpers");



class MongoDbController
{
    // Static variables
    static mongoUri;
    static dbName;
    static collectionName;
    static findParams = {};
    static projectionParams = {};
    static sortOptions = {};
    static Model;
    static _connection = new MongoDbConnection({
        dbName: this.dbName,
        uri: this.mongoUri,
    });
    static logger = console;



    /* 
     * GETS
     */

    static async getAll(
        findParams = this.findParams,
        projectionParams = this.projectionParams,
    )
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
                MongoDbControllerHelpers.queryResources({
                    connection: this._connection,
                    findParams,
                    projectionParams,
                    collectionName: this.collectionName,
                    sortOptions: this.sortOptions,
                    Model: this.Model,
                })
                .then((mongoResults) =>
                {
                    resolve(mongoResults);
                })
                .catch((errResults) =>
                {
                    this.logger.error("Failed to query resources from database:", errResults);
                    reject(errResults);
                });
            })
            .catch((errors) =>
            {
                reject(errors);
            });
        });
    }

    static async getMostRecent(
        findParams = this.findParams,
        projectionParams = this.projectionParams,
    )
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
                    projectionParams,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((mongoResults) =>
                {
                    if (mongoResults && mongoResults.results)
                    {
                        resolve(mongoResults.results);
                    }
    
                    else
                    {
                        this.logger.error(
                            "Successfully queried resources from " + 
                            "database, but an unknown error " + 
                            "occurred while parsing the results.", mongoResults
                        );
    
                        reject(`An unknown error occurred in ` + 
                               `${this.name}.getMostRecent()`);
                    }
                })
                .catch((errResults) =>
                {
                    this.logger.error("Failed to query resources from database:", errResults);
                    resolve(errResults);
                });
            })
            .catch((errors) =>
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
                MongoDbControllerHelpers.insertOne({
                    connection: this._connection,
                    obj,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    this.logger.error(`Failed to insert one ${this.Model.name} into database:`, errResults);
                    reject(errResults);
                });
            })
            .catch((errors) =>
            {
                reject(errors);
            });
        });
    }

    static async insertOneIfNotExists(findParams = this.findParams, obj)
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
                MongoDbControllerHelpers.insertOneIfNotExists({
                    connection: this._connection,
                    findParams,
                    obj,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    this.logger.error(`Failed to insert one ${this.Model.name} into database:`, errResults);
                    reject(errResults);
                });
            })
            .catch((errors) =>
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
                MongoDbControllerHelpers.findOneAndUpdate({
                    connection: this._connection,
                    findParams,
                    obj,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    this.logger.error(`Failed to update one ${this.Model.name} in database:`, errResults);
                    reject(errResults);
                });
            })
            .catch((errors) =>
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
                MongoDbControllerHelpers.findOneAndDelete({
                    connection: this._connection,
                    findParams,
                    collectionName: this.collectionName,
                    Model: this.Model,
                })
                .then((model) =>
                {
                    resolve(model);
                })
                .catch((errResults) =>
                {
                    this.logger.error(`Failed to delete one ${this.Model.name} from database:`, errResults);
                    reject(errResults);
                });
            })
            .catch((errors) =>
            {
                reject(errors);
            });
        });
    }
}





module.exports = MongoDbController;
