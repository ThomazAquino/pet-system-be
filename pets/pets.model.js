const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    avatar: { type: String, required: false },
    name: { type: String, required: true },
    type: { type: String, required: true },
    breed: { type: String, required: true },
    color: { type: String, required: true },
    status: { type: String, required: false },
    tutorId: { type: Schema.Types.ObjectId, ref: 'Account' },
    treatments: { type: Array, required: false, "default" : [] },
    qrCode: { type: String, required: false },
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.passwordHash;
    }
});

module.exports = mongoose.model('Pets', schema);