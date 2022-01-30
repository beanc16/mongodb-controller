class ModelNotSetError extends Error
{
    constructor(controllerName)
    {
        super(`${controllerName} must have a static Model set`);
        this.name = "ModelNotSetError";
    }
}



module.exports = ModelNotSetError;
