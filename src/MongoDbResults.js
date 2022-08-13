class MongoDbResults
{
    constructor({
        results = null,
        error = null,
        statusCode,
    } = {})
    {
        this.results = results;
        this.error = error;
        
        if (statusCode != null)
        {
            this.statusCode = statusCode;
        }
        // Assume call succeeded if no error is given
        else if (error === null)
        {
            this.statusCode = 200;
        }
    }
    
    
    
    wasSuccessful()
    {
        if (this.results !== null || this.statusCode === 200)
        {
            return true;
        }
        
        return false;
    }
}





module.exports = MongoDbResults;
