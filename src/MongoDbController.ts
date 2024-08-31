import { Document } from 'mongodb';
import { MongoDbConnection } from './MongoDbConnection.js';
import { MongoDbControllerHelpers } from './MongoDbControllerHelpers.js';
import { MongoDbResults } from './MongoDbResults.js';
import { AggregateArrayOptions, FindParams, Model, ProjectionParams, SortOptions } from './types.js';



export class MongoDbController
{
    // Static variables
    static mongoUri: string;
    static dbName: string;
    static collectionName: string;
    static findParams: FindParams = {};
    static projectionParams: ProjectionParams = {};
    static aggregateArrayOptions: AggregateArrayOptions = [];
    static sortOptions: SortOptions = {};
    static Model: Model;
    private static _connection = new MongoDbConnection({
        // @ts-ignore -- This should be set on the subclass
        dbName: this.dbName,
        // @ts-ignore -- This should be set on the subclass
        uri: this.mongoUri,
    });
    static logger = console;



    /* 
     * GETS
     */

    static async getAll(
        findParams = this.findParams,
        projectionParams = this.projectionParams,
    ): Promise<MongoDbResults>
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
    ): Promise<MongoDbResults | undefined>
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
                    if (mongoResults && mongoResults.results && !mongoResults.error)
                    {
                        resolve(mongoResults.results);
                    }

                    else if (mongoResults && !mongoResults.results && !mongoResults.error)
                    {
                        resolve(undefined);
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

    static async aggregate(
        aggregateArrayOptions = this.aggregateArrayOptions,
    ): Promise<MongoDbResults>
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
                MongoDbControllerHelpers.aggregate({
                    connection: this._connection,
                    aggregateArrayOptions,
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
                    this.logger.error("Failed to aggregate resources from database:", errResults);
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
     * POSTS
     */

    static async insertOne(obj: Document): Promise<MongoDbResults>
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

    static async insertOneIfNotExists(findParams = this.findParams, obj: Document): Promise<MongoDbResults>
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

    static async findOneAndUpdate(findParams = this.findParams, obj: Document, {
        operator = "set",
        arrayFilters = [],
    } = {}): Promise<MongoDbResults>
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
                    operator,
                    arrayFilters,
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

    static async findOneAndDelete(findParams: FindParams): Promise<MongoDbResults>
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
