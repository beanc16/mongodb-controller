class EmptyResultError extends Error
{
    constructor(modelName)
    {
        super(`No ${modelName} was found in the database`);
        this.name = "EmptyResultsError";
    }
}



module.exports = EmptyResultError;
