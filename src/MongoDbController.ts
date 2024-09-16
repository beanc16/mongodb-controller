import { Document } from 'mongodb';
import { MongoDbConnection } from './MongoDbConnection.js';
import { MongoDbControllerHelpers } from './MongoDbControllerHelpers.js';
import { MongoDbResults } from './MongoDbResults.js';
import {
    AggregateArrayOptions,
    ArrayFilters,
    FindParams,
    Model,
    MongoDbControllerHelpersBulkDeleteParameters,
    MongoDbControllerHelpersBulkInsertParameters,
    MongoDbControllerHelpersBulkUpdateParameters,
    Operator,
    ProjectionParams,
    SortOptions,
} from './types.js';



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
    ): Promise<MongoDbResults<typeof this.Model['prototype']>>
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
    ): Promise<MongoDbResults<typeof this.Model['prototype']> | undefined>
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
    ): Promise<MongoDbResults<typeof this.Model['prototype']>>
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

    static async insertOne(obj: Document): Promise<typeof this.Model['prototype']>
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

    static async insertOneIfNotExists(findParams = this.findParams, obj: Document): Promise<MongoDbResults<typeof this.Model['prototype']>>
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
    }: {
        operator?: Operator;
        arrayFilters?: ArrayFilters;
    } = {}): Promise<MongoDbResults<typeof this.Model['prototype']>>
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

    static async findOneAndDelete(findParams: FindParams): Promise<MongoDbResults<typeof this.Model['prototype']>>
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



    /* 
     * MULTI-OPERATION
     */

    static async bulkWrite({
        inserts = [],
        updates = [],
        deletes = [],
    }: {
        inserts?: Document[];
        updates?: {
            findParams?: FindParams;
            obj: Document;
            arrayFilters?: ArrayFilters;
            operator?: Operator;
        }[];
        deletes?: {
            findParams?: FindParams;
        }[];
    }): Promise<MongoDbResults<typeof this.Model['prototype']>>
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
                // Set up parameters
                const insertParams = inserts.map<MongoDbControllerHelpersBulkInsertParameters>((obj) =>
                {
                    return {
                        type: 'insert',
                        Model: this.Model,
                        obj,
                    };
                });
                const updateParams = updates.map<MongoDbControllerHelpersBulkUpdateParameters>(({
                    arrayFilters = [],
                    findParams = this.findParams,
                    obj,
                    operator = 'set',
                }) =>
                {
                    return {
                        type: 'update',
                        Model: this.Model,
                        findParams,
                        arrayFilters,
                        obj,
                        operator,
                    };
                });
                const deleteParams = deletes.map<MongoDbControllerHelpersBulkDeleteParameters>(({
                    findParams = this.findParams,
                }) =>
                {
                    return {
                        type: 'delete',
                        Model: this.Model,
                        findParams,
                    };
                });

                MongoDbControllerHelpers.bulkWrite({
                    connection: this._connection,
                    collectionName: this.collectionName,
                    operations: [
                        ...insertParams,
                        ...updateParams,
                        ...deleteParams,
                    ],
                })
                .then((results) =>
                {
                    resolve(results);
                })
                .catch((errResults) =>
                {
                    this.logger.error(`Failed to run bulkWrite with ${this.Model.name} in ${this.name}:`, errResults);
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
