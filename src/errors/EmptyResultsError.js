class EmptyResultsError extends Error
{
    constructor(modelName)
    {
        super(`No ${modelName}s were found in the database`);
        this.name = "EmptyResultsError";
    }
}



module.exports = EmptyResultsError;
