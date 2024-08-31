import { Document, Filter, Sort } from 'mongodb';

export type ArrayFilters = Document[];
export type AggregateArrayOptions = Document[];
export type FindParams = Filter<Document>;
export type ProjectionParams = Document;
export type SortOptions = Sort;

// Class
export type Model<Instance = any> = new(...args: any[]) => Instance;
export type InstanceOfModel = Model['prototype'];
