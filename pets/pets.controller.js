const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const petsService = require('./pets.service');



// routes
// router.post('/register', registerSchema, register);
//router.get('/', authorize(Role.Admin), getAll);
router.get('/', getAll);
router.get('/:id', authorize(), getById);
router.post('/', createSchema, create);
// router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

module.exports = router;

// function registerSchema(req, res, next) {
//     const schema = Joi.object({
//         avatar: Joi.string(),
//         name: Joi.string().required(),
//         type: Joi.string().required(),
//         breed: Joi.string().email().required(),
//         color: Joi.string(),
//         status: Joi.string(),
//         tutorId: Joi.string(),
//         treatments: Joi.array().items(Joi.string()),
//         qrCode: Joi.string()
//     });
//     validateRequest(req, next, schema);
// }

// function register(req, res, next) {
//     petsService.register(req.body, req.get('origin'))
//         .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
//         .catch(next);
// }

function getAll(req, res, next) {
    petsService.getAll()
        .then(pets => res.json(pets))
        .catch(next);
}

function getById(req, res, next) {
    // users can get their own account and admins can get any account

    // TODO Check this .user.
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    petsService.getById(req.params.id)
        .then(pet => pet ? res.json(pet) : res.sendStatus(404))
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        avatar: Joi.string(),
        name: Joi.string().required(),
        type: Joi.string().required(),
        breed: Joi.string().required(),
        color: Joi.string(),
        status: Joi.string(),
        tutorId: Joi.string(),
        treatments: Joi.array().items(Joi.string()),
        qrCode: Joi.string()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    petsService.create(req.body)
        .then(pets => res.json(pets))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schemaRules = {
        avatar: Joi.string(),
        name: Joi.string().required(),
        type: Joi.string().required(),
        breed: Joi.string().email().required(),
        color: Joi.string(),
        status: Joi.string(),
        tutorId: Joi.string(),
        treatments: Joi.array().items(Joi.string()),
        qrCode: Joi.string()
    };

    // only admins can update role

    // TODO: change to pets?
    if (req.user.role === Role.Admin) {
        schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
    }

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    // users can update their own account and admins can update any account
    // TODO: check this .user.
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    petsService.update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next);
}

function _delete(req, res, next) {
    // TODO: check this .user.
    // users can delete their own account and admins can delete any account
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    petsService.delete(req.params.id)
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next);
}