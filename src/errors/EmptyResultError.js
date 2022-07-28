class EmptyResultError extends Error
{
    constructor(modelName)
    {
        super(`No ${modelName} was found in the database`);
        this.name = "EmptyResultError";
    }
}



module.exports = EmptyResultError;
