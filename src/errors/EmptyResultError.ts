export class EmptyResultError extends Error
{
    constructor(modelName: string)
    {
        super(`No ${modelName} was found in the database`);
        this.name = "EmptyResultError";
    }
}
