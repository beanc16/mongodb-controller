class ModelIsInvalidError extends Error
{
    constructor(modelName)
    {
        super(`${modelName} is invalid (try checking the casing of parameters)`);
        this.name = "ModelIsInvalidError";
    }
}



module.exports = ModelIsInvalidError;
