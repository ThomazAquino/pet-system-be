﻿// The accounts controller defines all /accounts routes for the Node.js boilerplate api, the route definitions are
// grouped together at the top of the file and the implementation functions are below, followed by local helper
// functions. The controller is bound to the /accounts path in the main server.js file.

// Routes that require authorization include the middleware function authorize() and optionally specify a role
// (e.g. authorize(Role.Admin), if a role is specified then the route is restricted to users in that role, otherwise
// the route is restricted to all authenticated users regardless of role. The auth logic is located in the authorize
// middleware.

// The route functions revokeToken, getById, update and _delete include an extra custom authorization check to
// prevent non-admin users from accessing accounts other than their own. So regular user accounts (Role.User) have
// CRUD access to their own account but not to others, and admin accounts (Role.Admin) have full CRUD access to all accounts.

// Routes that require schema validation include a middleware function with the naming convention <route>Schema
// (e.g. authenticateSchema). Each schema validation function defines a schema for the request body using the Joi library and calls validateRequest(req, next, schema) to ensure the request body is valid. If validation succeeds the request continues to the next middleware function (the route function), otherwise an error is returned with details of why validation failed. For more info about Joi schema validation see https://www.npmjs.com/package/joi.

// Express is the web server used by the boilerplate api, it's one of the most popular web application frameworks
// for Node.js. For more info see https://expressjs.com/.


const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const accountService = require('./account.service');

const multer = require("multer");
const multerConfig = require("../_middleware/multer.config");


// routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.get('/', authorize([Role.Admin, Role.Vet, Role.Nurse]), getAll);
router.get('/:id', authorize([Role.Admin, Role.Vet, Role.Nurse]), getById);
router.get('/many/:ids', authorize([Role.Admin, Role.Vet, Role.Nurse]), getManyByIds);
router.post('/', authorize([Role.Admin, Role.Vet]), createSchema, multer(multerConfig.config).single("avatar"), create);
router.put('/:id', authorize([Role.Admin, Role.Vet, Role.Nurse]), updateSchema, multer(multerConfig.config).single("avatar"), update);
router.delete('/:id', authorize([Role.Admin]), _delete);

module.exports = router;

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    accountService.authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function refreshToken(req, res, next) {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    accountService.refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    accountService.revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        avatar: Joi.string(),
        telephone: Joi.string(),
        cellphone: Joi.string(),
        street: Joi.string(),
        streetNumber: Joi.string(),
        postalCode: Joi.string(),
        birthday: Joi.string(),
        cpf: Joi.string(),
        pets: Joi.array().items(Joi.string()),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean().valid(true).required()
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    accountService.register(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
        .catch(next);
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
    accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
    accountService.forgotPassword(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
    accountService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}

function resetPasswordSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
    accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}

function getAll(req, res, next) {
    accountService.getAll()
        .then(accounts => res.json(accounts))
        .catch(next);
}

function getById(req, res, next) {
    // users can get their own account and admins can get any account
    if (req.params.id !== req.user.id && req.user.role === Role.User) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    accountService.getById(req.params.id)
        .then(account => account ? res.json(account) : res.sendStatus(404))
        .catch(next);
}

function getManyByIds(req, res, next) {
    // users can get their own account and admins can get any account

    // TODO Check this .user.
    if (req.params.id !== req.user.id && req.user.role === Role.User) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const ids = req.params.ids.split(',');
    // console.log('ids--> ', ids)

    accountService.getManyByIds(ids)
        .then(accounts => accounts ? res.json(accounts) : res.sendStatus(404))
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Admin, Role.Vet, Role.Nurse, Role.User).required(),
        avatar: Joi.string().allow(null, ''),
        telephone: Joi.string(),
        cellphone: Joi.string(),
        street: Joi.string(),
        streetNumber: Joi.string(),
        postalCode: Joi.string(),
        birthday: Joi.string(),
        cpf: Joi.string(),
        pets: Joi.array().items(Joi.string())
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {

    // Case a image was uploaded.
    if (req.file && req.file.filename) {
        req.body.avatar = req.file.filename;
    }

    accountService.create(req.body)
        .then(accountIdAndAvatarPath => res.json(accountIdAndAvatarPath))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schemaRules = {
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
        role: Joi.string().valid(Role.Admin, Role.Vet, Role.Nurse, Role.User).required(),
        avatar: Joi.string().allow(null, ''),
        telephone: Joi.string(),
        cellphone: Joi.string(),
        street: Joi.string(),
        streetNumber: Joi.string(),
        postalCode: Joi.string(),
        birthday: Joi.string(),
        cpf: Joi.string(),
        pets: Joi.array().items(Joi.string())
    };

    // only admins can update role
    if (req.user.role === Role.Admin) {
        schemaRules.role = Joi.string().valid(Role.Admin, Role.Vet, Role.Nurse, Role.User).empty('');
    }

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    // users can update their own account and admins can update any account
    if (req.params.id !== req.user.id && req.user.role === Role.User) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Case a image was uploaded.
    if (req.file && req.file.filename) {
        req.body.avatar = req.file.filename;
    }
    // Multer was creating a empty property named changes.
    delete req.body.changes;

    accountService.update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next);
}

function _delete(req, res, next) {
    // users can delete their own account and admins can delete any account
    if (req.params.id !== req.user.id && req.user.role === Role.User) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    accountService.delete(req.params.id)
        .then(() => res.status(204).send())
        .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7*24*60*60*1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}