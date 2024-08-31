import { InstanceOfModel } from './types.js';

export class MongoDbResults<Instance extends InstanceOfModel = InstanceOfModel>
{
    public results: Instance[] | Instance | null;
    public error: Error | null;
    public statusCode?: number;

    constructor({
        results = null,
        error = null,
        statusCode,
    }: {
        results?: Instance[] | Instance | null;
        error?: Error | null;
        statusCode?: number;
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

    wasSuccessful(): boolean
    {
        if (this.results !== null || this.statusCode === 200)
        {
            return true;
        }
        
        return false;
    }
}
