export class EmptyResultsError extends Error
{
    constructor(modelName: string)
    {
        super(`No ${modelName}s were found in the database`);
        this.name = "EmptyResultsError";
    }
}
