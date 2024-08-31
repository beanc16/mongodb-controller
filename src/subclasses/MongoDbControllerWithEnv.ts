import { MongoDbController } from '../MongoDbController.js';



export class MongoDbControllerWithEnv extends MongoDbController
{
    static findParams = (process && process.env && process.env.STAGE)
                        ? { env: process.env.STAGE }
                        : MongoDbController.findParams;
}
