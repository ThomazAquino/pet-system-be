    const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const treatmentsService = require('../treatments/treatments.service');



// routes
// router.post('/register', registerSchema, register);
//router.get('/', authorize(Role.Admin), getAll);
router.get('/', authorize([Role.Admin, Role.Vet, Role.Nurse]), getAll);
router.get('/:id', authorize(), getById);
router.get('/many/:ids', authorize(), getManyByIds);
router.post('/', authorize(Role.Admin), createSchema, create);

router.put('/:id', authorize([Role.Admin, Role.Vet, Role.Nurse]), updateSchema, update);
router.put('/close/:id', authorize([Role.Admin, Role.Vet, Role.Nurse]), close);


router.delete('/:id', authorize([Role.Admin]), _delete);

module.exports = router;


function getAll(req, res, next) {
    treatmentsService.getAll()
        .then(treatments => res.json(treatments))
        .catch(next);
}

function getById(req, res, next) {
    treatmentsService.getById(req.params.id)
        .then(treatment => treatment ? res.json(treatment) : res.sendStatus(404))
        .catch(next);
}

function getManyByIds(req, res, next) {
    const ids = req.params.ids.split(',');

    treatmentsService.getManyByIds(ids)
        .then(treatments => treatments ? res.json(treatments) : res.sendStatus(404))
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        status: Joi.string().required(),
        enterDate: Joi.string().required(),
        dischargeDate: Joi.string().allow(null, ''),
        medications: Joi.array().items(Joi.string()),
        food: Joi.array().items(Joi.string()),
        conclusiveReport: Joi.string().allow(null, ''),
        conclusiveReportShort: Joi.string().allow(null, ''),
        dischargeCare: Joi.string().allow(null, ''),
        clinicEvo: Joi.object().allow(null, ''),
        clinicEvoResume: Joi.number().allow(null, ''),
        petId: Joi.string(),
        petName: Joi.string(),
        vetId: Joi.string(),
        vetName: Joi.string(),
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    treatmentsService.create(req.body)
        .then(treatmentId => res.json(treatmentId))
        .catch(next);
}

function updateSchema(req, res, next) {
    let schemaRules;
    if (req.body.isNested) {
        schemaRules = {
            medications: Joi.object({
                name: Joi.string().required(),
                id: Joi.string().required(),
                name: Joi.string().required(),
                frequency: Joi.number().required(),
                firstDose: Joi.string().required(),
                lastDose: Joi.string().allow(null, ''),
                endDose: Joi.string().allow(null, '')
            }),
        }
    } else {
        schemaRules = {
            status: Joi.string(),
            enterDate: Joi.string(),
            dischargeDate: Joi.string(),
            medications: Joi.array().items(Joi.string()),
            food: Joi.array().items(Joi.string()),
            conclusiveReport: Joi.string(),
            conclusiveReportShort: Joi.string(),
            dischargeCare: Joi.string(),
            clinicEvo: { },
            clinicEvoResume: Joi.number(),
            petId: Joi.string(),
            petName: Joi.string(),
            vetId: Joi.string(),
            vetName: Joi.string(),
        };
    }
 
    const schema = Joi.object(schemaRules);

    validateRequest(req, next, schema);
}

function update(req, res, next) {
    if (req.body.isNested) {
        treatmentsService.updateNested(req.params.id, req.body)
            .then(treatment => res.json(treatment))
            .catch(next);

    } else {
        treatmentsService.update(req.params.id, req.body.changes)
            .then(treatment => res.json(treatment))
            .catch(next);
    }
    
}

function close(req, res, next) {
    console.log(req.params.id)
    treatmentsService.closeTreatment(req.params.id)
        .then(() => res.status(204).send())
        .catch(next);
}

function _delete(req, res, next) {
    treatmentsService.delete(req.params.id)
        .then((treatmentAndPet) => res.json({
            message: 'Treatment deleted successfully',
            success: true,
            treatmentAndPet: treatmentAndPet
        }))
        .catch(next);
}