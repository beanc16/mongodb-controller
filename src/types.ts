import { Document, Filter, Sort } from 'mongodb';
import { MongoDbConnection } from './MongoDbConnection.js';

export type ArrayFilters = Document[];
export type AggregateArrayOptions = Document[];
export type FindParams = Filter<Document>;
export type ProjectionParams = Document;
export type SortOptions = Sort;
export type Operator = 'currentDate'
                    | 'inc'
                    | 'min'
                    | 'max'
                    | 'mul'
                    | 'rename'
                    | 'set'
                    | 'setOnInsert'
                    | 'unset'
                    | 'addToSet'
                    | 'pop'
                    | 'pull'
                    | 'push'
                    | 'pullAll'
                    | 'bit';

// Class
export type Model<Instance = any> = new(...args: any[]) => Instance;
export type InstanceOfModel = Model['prototype'];

// Interfaces
export interface BaseMongoDbControllerHelpersParameters
{
    connection: MongoDbConnection;
    collectionName: string;
    Model: Model;
}

export interface MongoDbControllerHelpersQueryResourcesParameters extends BaseMongoDbControllerHelpersParameters
{
    findParams: FindParams;
    projectionParams: ProjectionParams;
    sortOptions: SortOptions;
}

export interface MongoDbControllerHelpersQueryResourceParameters extends BaseMongoDbControllerHelpersParameters {
    findParams: FindParams;
    projectionParams?: ProjectionParams;
    closeConnectionWhenDone?: boolean;
}

export interface MongoDbControllerHelpersAggregateParameters extends BaseMongoDbControllerHelpersParameters {
    aggregateArrayOptions: AggregateArrayOptions;
    sortOptions: SortOptions;
}

export interface MongoDbControllerHelpersInsertOneParameters extends BaseMongoDbControllerHelpersParameters
{
    obj: Document;
}

export interface MongoDbControllerHelpersInsertOneIfNotExistsParameters extends MongoDbControllerHelpersInsertOneParameters
{
    findParams: FindParams;
}

export interface MongoDbControllerHelpersFindOneAndUpdateParameters extends MongoDbControllerHelpersInsertOneIfNotExistsParameters
{
    operator: Operator;
    arrayFilters: ArrayFilters;
    shouldUpsert?: boolean;
}

export interface MongoDbControllerHelpersFindOneAndDeleteParameters extends BaseMongoDbControllerHelpersParameters
{
    findParams: FindParams;
}

// Bulk write
type TopLevelBulkWriteParams = 'connection' | 'collectionName';
export type BulkWriteOperations = 'insert' | 'update' | 'upsert' | 'delete';

export interface MongoDbControllerHelpersBulkInsertParameters extends Omit<MongoDbControllerHelpersInsertOneParameters, TopLevelBulkWriteParams>
{
    type: 'insert';
}

export interface MongoDbControllerHelpersBulkUpdateParameters extends Omit<MongoDbControllerHelpersFindOneAndUpdateParameters, TopLevelBulkWriteParams>
{
    type: 'update';
}

export interface MongoDbControllerHelpersBulkDeleteParameters extends Omit<MongoDbControllerHelpersFindOneAndDeleteParameters, TopLevelBulkWriteParams>
{
    type: 'delete';
}

export interface MongoDbControllerHelpersBulkWriteParameters extends Pick<BaseMongoDbControllerHelpersParameters, TopLevelBulkWriteParams>
{
    operations: (
        MongoDbControllerHelpersBulkInsertParameters
        | MongoDbControllerHelpersBulkUpdateParameters
        | MongoDbControllerHelpersBulkDeleteParameters
    )[];
}

export interface WithErrors
{
    errors: Error[];
}
