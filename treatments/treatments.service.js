const db = require('_helpers/db');

module.exports = {
    getAll,
    getById,
    getManyByIds,
    create,
    closeTreatment,
    update,
    updateNested,
    deleteManyTreatments,
    delete: _delete
};


const accountService = require('../accounts/account.service');
const petService = require('../pets/pets.service');


async function getAll() {
    const treatment = await db.Treatments.find();
    return treatment.map(x => basicDetails(x));
}

async function getById(id) {
    const treatment = await getTreatment(id);
    return basicDetails(treatment);
}

async function getManyByIds(ids) {
    const treatments = await getTreatments(ids);
    // console.log('3', treatments);

    if (treatments && treatments.length > 0) {
        const response = treatments.map(treatment => basicDetails(treatment))
        // console.log('RESP', response)
        return response;
    }
}

async function create(params) {
    const treatment = new db.Treatments(params);

    // save account
    await treatment.save();

    // console.log('Treatment id -->', treatment.id)
    // console.log('Pet id = ', treatment.petId);

    // Update pet
    await petService.addTreatmentToPet(treatment.petId, treatment._id)
        .then()
        .catch(err =>{console.log('ERRO::::', err); return err});


    return treatment.id; 
}

async function closeTreatment(id) {
    const treatment = await getTreatment(id);

    treatment.status = 'closed';
    await treatment.save();

    // Change pet status to in-home

    await petService.changePetStatus(treatment.petId, 'in-home')
        .then()
        .catch(err =>{console.log('ERRO::::', err); return err}); 
}

async function update(id, params) {
    const treatment = await getTreatment(id);
    // console.log(treatment)

    // copy params to pet and save
    Object.assign(treatment, params);
    await treatment.save(treatment);


    let updatedTreatment = { 
        treatment: {
            id: treatment.id,
            changes: {}
        }
    }

    Object.keys(params).map(param => {
        updatedTreatment.treatment.changes[param] = treatment[param];
    });

    // console.log(updatedTreatment)

    return updatedTreatment;
}

async function updateNested(id, params) {
    const treatment = await getTreatment(id);
    console.log(params);
    
    const incomePropertyName = Object.keys(params.changes)[0];
    const incomePropertyValue = params.changes[incomePropertyName];

    if (params.operation === 'add') {
        treatment[incomePropertyName] = [...treatment[incomePropertyName], incomePropertyValue];

    } else if (params.operation === 'update') {
        treatment[incomePropertyName] = treatment[incomePropertyName].map(value => {
            return value.id === incomePropertyValue.id ? incomePropertyValue : value;
        });
    } else if (params.operation === 'delete') {
        treatment[incomePropertyName] = treatment[incomePropertyName].filter(value => value.id !== incomePropertyValue.id);
    }

    await treatment.save(treatment);

    console.log(treatment);

    let changes = {};
    changes[incomePropertyName] = treatment[incomePropertyName];

    return {
        treatment: { 
            id: treatment.id,
            changes: changes
        }
    } ;
}

async function _delete(id) {
    const treatment = await getTreatment(id);

    let updatedPet;
    // Update tutor
    await petService.removeTreatmentToPet(treatment.petId, treatment.id)
        .then(pet => updatedPet = pet)
        .catch(err =>{console.log('ERRO::::', err); return err});

    await treatment.remove();

    // console.log(updatedPet)
    return {treatment: basicDetails(treatment), pet: updatedPet};
}

async function deleteManyTreatments(ids) {
    await db.Treatments.deleteMany({
        _id: {
            $in: ids
        }
    },
    function(err, result) {
        if (err) {
            console.log('ERR::deleteManyTreatments', err )
        return err;
        } else {
            console.log('Success deleteManyTreatments ->', result )
        return result;
        }
    }
);
}

// helper functions

async function getTreatment(id) {
    if (!db.isValidId(id)) throw 'Treatment not found';
    const treatments = await db.Treatments.findById(id);
    if (!treatments) throw 'Treatment not found';
    return treatments;
}

async function getTreatments(ids) {
    const validIds = ids.filter(id => db.isValidId(id));
    // console.log('valid ids', validIds)
    const treatments = await db.Treatments.find().where('_id').in(validIds).exec();
    
    // const account = await db.Account.findById(id);
    if (!treatments) throw 'Treatments not found.';
    return treatments;
}

function basicDetails(account) {
    // different based on account.type or account.role
    const { id, status, enterDate, dischargeDate, medications, food, conclusiveReport, conclusiveReportShor, dischargeCare, clinicEvo, clinicEvoResume, petId, petName, vetId, vetName } = account;
    return { id, status, enterDate, dischargeDate, medications, food, conclusiveReport, conclusiveReportShor, dischargeCare, clinicEvo, clinicEvoResume, petId, petName, vetId, vetName };
}
     