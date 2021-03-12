const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
};

mongoose.connect('mongodb://localhost/node-mongo-signup-verification-api');
mongoose.Promise = global.Promise;

module.exports = {
    Pets: require('pets/pets.model'),
    Account: require('accounts/account.model'),
    Treatments: require('treatments/treatments.model'),
    RefreshToken: require('accounts/refresh-token.model'),
    isValidId
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}