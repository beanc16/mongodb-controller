const { MongoClient } = require("mongodb");
const {
    MongoDbNameNotSetError,
    MongoUriNotSetError,
} = require("./errors");



class MongoDbConnection
{
    constructor({ dbName, uri })
    {
        const mongoUri = getMongoUri(uri);
        const mongoDbName = getMongoDbName(dbName);

        this._mongoUri = mongoUri;
        this.client = new MongoClient(mongoUri);
        this.collections = [];
        this.dbName = mongoDbName;
    }

    async run({ dbName })
    {
        return new Promise((resolve, reject) =>
        {
            this.open()
            .then(() =>
            {
                const db = (dbName) 
                            ? this.client.db(dbName) 
                            : this.client.db(this.dbName);

                resolve(db, this.client);
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
    
    async getCollection({
        collectionName,
        dbName,
    })
    {
        return new Promise((resolve, reject) =>
        {
            this.run({ dbName })
            .then((db/*, client*/) =>
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

    async open()
    {
        return new Promise((resolve, reject) =>
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
    
    async close()
    {
        return new Promise((resolve, reject) =>
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
function getMongoUri(uri)
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

function getMongoDbName(dbName)
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





module.exports = MongoDbConnection;
