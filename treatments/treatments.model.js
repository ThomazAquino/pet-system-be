const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    status: { type: String, required: true },
    enterDate: { type: String, required: true },
    dischargeDate: { type: String, required: false },
    medications: { type: Array, required: false, "default" : [] },
    food: { type: Array, required: false, "default" : [] },
    conclusiveReport: { type: String, required: false },
    conclusiveReportShort: { type: String, required: false },
    dischargeCare: { type: String, required: false },
    clinicEvo: { },
    clinicEvoResume: { type: Number, required: false },
    petId: { type: Schema.Types.ObjectId, ref: 'Pet' },
    petName: { type: String, required: true },
    vetId: { type: Schema.Types.ObjectId, ref: 'Account' },
    vetName: { type: String, required: true },
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
});

module.exports = mongoose.model('Treatment', schema);