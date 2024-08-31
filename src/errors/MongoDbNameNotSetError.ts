const errMsg = `Either process.env.MONGO_DB_NAME or \
MongoController.dbName must be set`;



export class MongoDbNameNotSetError extends Error
{
    constructor()
    {
        super(errMsg);
        this.name = "MongoDbNameNotSetError";
    }
}
