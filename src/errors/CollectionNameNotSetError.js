const errMsg = `The controller must have a \
static collectionName set`;



class CollectionNameNotSetError extends Error
{
    constructor()
    {
        super(errMsg);
        this.name = "CollectionNameNotSetError";
    }
}



module.exports = CollectionNameNotSetError;
