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

        this.client = new MongoClient(mongoUri);
        this.collections = [];
        this.dbName = mongoDbName;
    }
    
    async run({ dbName })
    {
        return new Promise((resolve, reject) =>
        {
            this.client.connect()
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
                .finally(function ()
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
            .then(function (db/*, client*/)
            {
                const collection = db.collection(collectionName);
                resolve(collection);
            })
            .catch(function (err)
            {
                reject(err);
            });
        });
    }
    
    async close()
    {
        return new Promise((resolve, reject) =>
        {
            this.client.close()
            .then(function ()
            {
                resolve();
            })
            .catch(function (err)
            {
                reject(err);
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
