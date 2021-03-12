const db = require('_helpers/db');

module.exports = {
    getAll,
    getById,
    getManyByIds,
    create,
    update,
    addTreatmentToPet,
    changePetStatus,
    removeTreatmentToPet,
    test,
    delete: _delete,
    deleteManyPets,
    deletePetAndRemoveFromUser
};

const accountService = require('../accounts/account.service');
const treatmentService = require('../treatments/treatments.service');


async function getAll() {
    const pets = await db.Pets.find();
    return pets.map(x => basicDetails(x));
}

async function getById(id) {
    const pet = await getPet(id);
    return basicDetails(pet);
}


async function getManyByIds(ids) {
    const pets = await getPets(ids);
    // console.log('after', pets);

    if (pets && pets.length > 0) {
        const response = pets.map(pets => basicDetails(pets))
        // console.log('RESP', response)
        return response;
    }
}

async function create(params) {
    const pet = new db.Pets(params);
    await pet.save();

    await accountService.addPetToUser(params.tutorId, pet.id)
        .then(_ => pet.id)
        .catch(err =>{console.log('ERRO::::', err); return err});

    return pet.id;
    
}

async function update(id, params) {
    const pet = await getPet(id);

    // copy params to pet and save
    Object.assign(pet, params);
    await pet.save();

    let changes = {};
    Object.keys(params).map(param => {
        changes[param] = pet[param];
    });

    return { 
        id: pet.id,
        changes: changes
    };
}

async function _delete(id) {
    const pet = await getPet(id);
    await pet.remove();
}

async function deleteManyPets(petIds) {
    const pets = await db.Pets.find().where('_id').in(petIds).exec();
    let treatmentIds = [];
    pets.forEach(pet => {
        pet.treatments.forEach(treatment => {
            treatmentIds.push(treatment._id.toString());
        });
    });
    await treatmentService.deleteManyTreatments(treatmentIds)


    await db.Pets.deleteMany({
        _id: {
            $in: petIds
        }
    },
    function(err, result) {
        if (err) {
            console.log('ERR::deleteManyPets', err )
        return err;
        } else {
            console.log('Success deleteManyPets ->', result )
        return result;
        }
    }
    );
}

async function deletePetAndRemoveFromUser(id) {
    const pet = await getPet(id);

    await treatmentService.deleteManyTreatments(pet.treatments);

    // Update tutor
    const tutorId = pet.tutorId._id.toString();
    await accountService.removePetToUser(tutorId, pet.id)
        .then()
        .catch(err =>{console.log('ERROR:::', err); return err});

    await pet.remove();
    console.log('Pet removed');
}

async function addTreatmentToPet(petId, _treatmentId) {
    const pet = await getPet(petId);

    pet.treatments = [...pet.treatments, _treatmentId];
    pet.status = 'interned';
    await pet.save();

    return basicDetails(pet);
}

async function changePetStatus(petId, status) {
    const pet = await getPet(petId);
    pet.status = status;
    await pet.save();
    return basicDetails(pet);
}

async function removeTreatmentToPet(petId, treatmentId) {
    const pet = await getPet(petId);

    pet.treatments = pet.treatments.filter(treatmentsIdsInPet => treatmentsIdsInPet !== treatmentId);
    await pet.save();
    return basicDetails(pet);
}

async function test(params) {

    let petIds = ['604b7974a00f012b3c6ef881', '604b7985a00f012b3c6ef885'];

    const pets = await db.Pets.find().where('_id').in(petIds).exec();

    console.log(pets);
    pets[0].treatments[0]._id.toString();

    let ids = [];

    pets.forEach(pet => {
        pet.treatments.forEach(treatment => {
            ids.push(treatment._id.toString());
        });
    });

    console.log(ids);


    await treatmentService.deleteMany(ids);


    console.log(pets);

    return 'TEST' 
}


// helper functions

async function getPet(id) {
    if (!db.isValidId(id)) throw 'Pet not found';
    const pet = await db.Pets.findById(id);
    if (!pet) throw 'Pet not found';
    return pet;
}

async function getPets(ids) {
    const validIds = ids.filter(id => db.isValidId(id));
    console.log('valid ids', validIds)
    const pets = await db.Pets.find().where('_id').in(validIds).exec();
    
    // const account = await db.Account.findById(id);
    if (!pets) throw 'Pets not found.';
    return pets;
}

function basicDetails(account) {
    // different based on account.type or account.role
    const { id, avatar, name, type, breed, color, status, tutorId, treatments, qrCode } = account;
    return { id, avatar, name, type, breed, color, status, tutorId, treatments, qrCode };
}
