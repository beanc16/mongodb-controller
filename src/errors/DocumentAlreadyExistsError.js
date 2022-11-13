class DocumentAlreadyExistsError extends Error
{
    constructor(modelName, verbed = "inserted")
    {
        super(`${modelName} cannot be ${verbed} because a document with the given findParams already exists`);
        this.name = "DocumentAlreadyExistsError";
    }
}



module.exports = DocumentAlreadyExistsError;
