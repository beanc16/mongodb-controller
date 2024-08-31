export class DocumentAlreadyExistsError extends Error
{
    constructor(modelName: string, verbed: string = "inserted")
    {
        super(`${modelName} cannot be ${verbed} because a document with the given findParams already exists`);
        this.name = "DocumentAlreadyExistsError";
    }
}
