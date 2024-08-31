const errMsg = `Either process.env.MONGO_URI or \
MongoController.mongoUri must be set`;



export class MongoUriNotSetError extends Error
{
    constructor()
    {
        super(errMsg);
        this.name = "MongoUriNotSetError";
    }
}
