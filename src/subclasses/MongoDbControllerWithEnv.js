const MongoDbController = require("../MongoDbController");



class MongoDbControllerWithEnv extends MongoDbController
{
    static findParams = (process && process.env && process.env.STAGE)
                        ? { env: process.env.STAGE }
                        : MongoDbController.findParams;
}





module.exports = MongoDbControllerWithEnv;
