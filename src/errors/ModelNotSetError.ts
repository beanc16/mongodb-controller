export class ModelNotSetError extends Error
{
    constructor(controllerName: string)
    {
        super(`${controllerName} must have a static Model set`);
        this.name = "ModelNotSetError";
    }
}
