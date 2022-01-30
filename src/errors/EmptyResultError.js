class EmptyResultError extends Error
{
    constructor(modelName)
    {
        super(`No ${modelName} was found`);
        this.name = "EmptyResultsError";
    }
}



module.exports = EmptyResultError;
