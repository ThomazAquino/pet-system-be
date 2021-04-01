const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
};

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost/node-mongo-signup-verification-api');
mongoose.Promise = global.Promise;

module.exports = {
    Pets: require('pets/pets.model'),
    Account: require('accounts/account.model'),
    Treatments: require('treatments/treatments.model'),
    RefreshToken: require('accounts/refresh-token.model'),
    ChatHistory: require('chat/chat-history.model'),
    ChatConversation: require('chat/chat-conversation.model'),
    isValidId
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}