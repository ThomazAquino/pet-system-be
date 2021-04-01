const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    lastUpdate: { type: String, required: false },
    messages: [{
        from: { type: Schema.Types.ObjectId, ref: 'Account' },
        to: { type: Schema.Types.ObjectId, ref: 'Account', required: false },
        date: { type: Date, default: Date.now },
        content:  { type: String, required: true }
    }]
});

module.exports = mongoose.model('ChatConversation', schema);