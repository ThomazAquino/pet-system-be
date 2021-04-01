const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    conversations: [
        {
            conversation: { type: Schema.Types.ObjectId, ref: 'ChatMessages' },
            lastUpdate: { type: String, required: false }
        }
    ],
});

module.exports = mongoose.model('ChatHistory', schema);