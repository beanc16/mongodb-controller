class EmptyResultsError extends Error
{
    constructor(modelName)
    {
        super(`No ${modelName}s were found`);
        this.name = "EmptyResultsError";
    }
}



module.exports = EmptyResultsError;
