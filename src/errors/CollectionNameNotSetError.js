class CollectionNameNotSetError extends Error
{
    constructor(controllerName)
    {
        super(`${controllerName} must have a static collectionName set`);
        this.name = "CollectionNameNotSetError";
    }
}



module.exports = CollectionNameNotSetError;
