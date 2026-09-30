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
    public client: MongoClient;
    private auditLogs: ConnectionAuditLog[];
    private connectPromise: Promise<void> | null = null;  // Track connection state

    constructor({ uri }: { uri: string; })
    {
        const mongoUri = this.getMongoUri(uri);

        this.client = new MongoClient(mongoUri); // Create only once
        this.auditLogs = [];
    }

    private async run({ dbName, guid }: WithDbName & WithGuid): Promise<Db>
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

    private async open(): Promise<void>
    {
        // Check if client is actually connected before reusing connectPromise
        const isConnected = this.client && (this.client as any).topology?.isConnected();

        // Stale or closed connection state; force a new connection attempt
        if (!isConnected)
        {
            this.connectPromise = null;
        }

        // If already connecting/connected, reuse that connection
        if (this.connectPromise)
        {
            return this.connectPromise;
        }

        this.connectPromise = new Promise<void>(async (resolve, reject) =>
        {
            try
            {
                await this.client.connect();
                resolve();
            }
            catch (err)
            {
                this.connectPromise = null; // Clear on error so retry works
                reject(err);
            }
        });

        return this.connectPromise;
    }

    public async close({ guid: auditLogGuid }: WithGuid): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            // Remove the given audit log
            this.removeAuditLog(auditLogGuid);

            // Remove any audit logs exceeding the max allowed connection time
            this.auditLogs = this.auditLogs.filter(
                (log) => Date.now() - log.unixTimestamp < MAX_CONNECTION_OPEN_TIME
            );

            // There's other operations still happening, so don't close yet
            if (this.auditLogs.length > 0)
            {
                resolve();
                return;
            }

            // Immediately clear connectPromise so pending/future calls don't attach to a closing client
            this.connectPromise = null;

            // There's no other operations happening, so close the connection
            this.client.close()
            .then(() =>
            {
                resolve();
            })
            .catch((err) =>
            {
                reject(err);
            });
        });
    }

    public removeAuditLog(guid: UUID): void
    {
        const index = this.auditLogs.findIndex((log) => log.guid === guid);

        if (index >= 0)
        {
            this.auditLogs.splice(index, 1);
        }
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
