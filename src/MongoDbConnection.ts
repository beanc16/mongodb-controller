import { Collection, Db, Document, MongoClient } from 'mongodb';
import { MongoUriNotSetError } from './errors/index.js';



interface WithDbName
{
    dbName: string;
}

export class MongoDbConnection
{
    private _mongoUri: string;
    public client: MongoClient;

    constructor({ uri }: { uri: string; })
    {
        const mongoUri = this.getMongoUri(uri);

        this._mongoUri = mongoUri;
        this.client = new MongoClient(mongoUri);
    }

    private async run({ dbName }: WithDbName): Promise<Db>
    {
        return new Promise((resolve, reject) =>
        {
            this.open()
            .then(() =>
            {
                const db = this.client.db(dbName);
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

    private async open(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const mongoUri = this.getMongoUri(this._mongoUri);
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

    public async close(): Promise<void>
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

    private getMongoUri(uri: string)
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
}
