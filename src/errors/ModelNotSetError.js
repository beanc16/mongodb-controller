const errMsg = `The controller must have a \
static Model set`;



class ModelNotSetError extends Error
{
    constructor()
    {
        super(errMsg);
        this.name = "ModelNotSetError";
    }
}



module.exports = ModelNotSetError;
