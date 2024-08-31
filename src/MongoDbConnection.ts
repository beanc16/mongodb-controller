import { Collection, Db, Document, MongoClient } from 'mongodb';
import {
    MongoDbNameNotSetError,
    MongoUriNotSetError,
} from './errors/index.js';



interface WithDbName
{
    dbName?: string;
}

export class MongoDbConnection
{
    private _mongoUri: string;
    public client: MongoClient;
    public dbName: string;

    constructor({ dbName, uri }: { dbName: string; uri: string; })
    {
        const mongoUri = getMongoUri(uri);
        const mongoDbName = getMongoDbName(dbName);

        this._mongoUri = mongoUri;
        this.client = new MongoClient(mongoUri);
        this.dbName = mongoDbName;
    }

    private async run({ dbName }: WithDbName): Promise<Db>
    {
        return new Promise((resolve, reject) =>
        {
            this.open()
            .then(() =>
            {
                const db = (dbName) 
                            ? this.client.db(dbName) 
                            : this.client.db(this.dbName);

                resolve(db);
            })
            .catch((err) =>
            {
                this.close()
                .finally(() =>
                {
                    reject(err);
                })
            });
        });
    }
    
    public async getCollection({
        collectionName,
        dbName,
    }: WithDbName & { collectionName: string }): Promise<Collection<Document>>
    {
        return new Promise((resolve, reject) =>
        {
            this.run({ dbName })
            .then((db) =>
            {
                const collection = db.collection(collectionName);
                resolve(collection);
            })
            .catch((err) =>
            {
                reject(err);
            });
        });
    }

    async open(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const mongoUri = getMongoUri(this._mongoUri);
            this.client = new MongoClient(mongoUri);
            this.client.connect()
            .catch((err) =>
            {
                this.close()
                .finally(() =>
                {
                    reject(err);
                })
            })
            .finally(() =>
            {
                resolve();
            });
        });
    }
    
    async close(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            this.client.close()
            .catch((err) =>
            {
                reject(err);
            })
            .finally(() =>
            {
                resolve();
            });
        });
    }
}



// Helpers
function getMongoUri(uri: string)
{
    if (uri)
    {
        return uri;
    }

    else if (process.env && process.env.MONGO_URI)
    {
        return process.env.MONGO_URI;
    }

    throw new MongoUriNotSetError();
}

function getMongoDbName(dbName: string)
{
    if (dbName)
    {
        return dbName;
    }

    else if (process.env && process.env.MONGO_DB_NAME)
    {
        return process.env.MONGO_DB_NAME;
    }

    throw new MongoDbNameNotSetError();
}
