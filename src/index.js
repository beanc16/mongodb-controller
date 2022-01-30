const MongoDbController = require("./MongoDbController");
const SubClasses = require("./subclasses");



module.exports = {
    MongoDbController,
    ...SubClasses,
};
