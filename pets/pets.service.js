const db = require('_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};


async function getAll() {
    const pets = await db.Pets.find();
    return pets.map(x => basicDetails(x));
}

async function getById(id) {
    const pet = await getPet(id);
    return basicDetails(pet);
}

async function create(params) {
    // TODO: Change to ID
    // if (await db.Account.findOne({ email: params.email })) {
    //     throw 'Email "' + params.email + '" is already registered';
    // }
    const pet = new db.Pets(params);

    // save account
    await pet.save();

    return basicDetails(pet);
}

async function update(id, params) {
    const pet = await getPet(id);

    // copy params to pet and save
    Object.assign(pet, params);
    await pet.save();

    return basicDetails(pet);
}

async function _delete(id) {
    const pet = await getPet(id);
    await pet.remove();
}

// helper functions

async function getPet(id) {
    if (!db.isValidId(id)) throw 'Pet not found';
    const pet = await db.Pets.findById(id);
    if (!pet) throw 'Pet not found';
    return pet;
}

function basicDetails(account) {
    // different based on account.type or account.role
    const { id, avatar, name, type, breed, color, status, tutorId, treatments, qrCode } = account;
    return { id, avatar, name, type, breed, color, status, tutorId, treatments, qrCode };
}
