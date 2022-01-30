const errMsg = `The model is invalid (try \
checking the casing of parameters)`;



class ModelIsInvalidError extends Error
{
    constructor()
    {
        super(errMsg);
        this.name = "ModelIsInvalidError";
    }
}



module.exports = ModelIsInvalidError;
