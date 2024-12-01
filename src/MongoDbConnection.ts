import { Collection, Db, Document, MongoClient } from 'mongodb';
import { randomUUID, UUID } from 'node:crypto';
import { MongoUriNotSetError } from './errors/index.js';



interface WithDbName
{
    dbName: string;
}

interface WithGuid
{
    guid: UUID;
}

interface ConnectionAuditLog extends WithGuid
{
    unixTimestamp: number;
}

// Don't allow connections to stay open for more than 30 seconds
const MAX_CONNECTION_OPEN_TIME = 30_000;

export class MongoDbConnection
{
    private mongoUri: string;
    public client: MongoClient;
    private auditLogs: ConnectionAuditLog[];

    constructor({ uri }: { uri: string; })
    {
        const mongoUri = this.getMongoUri(uri);

        this.mongoUri = mongoUri;
        this.client = new MongoClient(mongoUri);
        this.auditLogs = [];
    }

    private async run({ dbName, guid }: WithDbName & WithGuid): Promise<Db>
    {
        return new Promise((resolve, reject) =>
        {
            this.open({ guid })
            .then(() =>
            {
                const db = this.client.db(dbName);
                resolve(db);
            })
            .catch((err) =>
            {
                this.close({ guid })
                .finally(() =>
                {
                    reject(err);
                });
            });
        });
    }
    
    public async getCollection({
        collectionName,
        dbName,
    }: WithDbName & { collectionName: string }): Promise<{
        collection: Collection<Document>;
        auditLogGuid: UUID;
    }>
    {
        return new Promise((resolve, reject) =>
        {
            const guid = randomUUID();
            this.auditLogs.push({ guid, unixTimestamp: Date.now() });

            this.run({ dbName, guid })
            .then((db) =>
            {
                const collection = db.collection(collectionName);
                resolve({ collection, auditLogGuid: guid });
            })
            .catch((err) =>
            {
                reject(err);
            });
        });
    }

    private async open({ guid }: WithGuid): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const mongoUri = this.getMongoUri(this.mongoUri);
            this.client = new MongoClient(mongoUri);
            this.client.connect()
            .catch((err) =>
            {
                this.close({ guid })
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

    public async close({ guid: auditLogGuid }: WithGuid): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            // Remove the given audit log
            const index = this.auditLogs.findIndex(({ guid }) => guid === auditLogGuid);
            if (index >= 0)
            {
                this.auditLogs.splice(index, 1);
            }

            // Remove any audit logs exceeding the max allowed connection time
            const indicesToRemove: number[] = [];
            for (let i = 0; i < this.auditLogs.length; i += 1)
            {
                const { unixTimestamp } = this.auditLogs[i];
                const elaspedTimeInMillis = Date.now() - unixTimestamp;

                if (elaspedTimeInMillis >= MAX_CONNECTION_OPEN_TIME)
                {
                    indicesToRemove.push(i);
                }
            }
            indicesToRemove.forEach(i => this.auditLogs.splice(i, 1));

            // There's other operations still happening, so don't close yet
            if (this.auditLogs.length > 0)
            {
                resolve();
            }

            // There's no other operations happening, so close the connection
            else
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
            }
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
