export class CollectionNameNotSetError extends Error
{
    constructor(controllerName: string)
    {
        super(`${controllerName} must have a static collectionName set`);
        this.name = "CollectionNameNotSetError";
    }
}
