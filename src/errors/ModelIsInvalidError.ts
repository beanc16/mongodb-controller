export class ModelIsInvalidError extends Error
{
    constructor(modelName: string)
    {
        super(`${modelName} is invalid (try checking the casing of parameters)`);
        this.name = "ModelIsInvalidError";
    }
}
