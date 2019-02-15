//DEFINICION DE RUTAS USUARIO

//utilizar nuevas características de javascript
'use strict'

var express = require('express');
var UserController = require('../controllers/user');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

//middleware para subir archivos
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'}); //aqui se guardarán las imagenes que usa el usuario

api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth , UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/recuperar_cuenta', UserController.sendEmailRecuperarCuenta);
api.post('/restablecer_cuenta', UserController.restablecerCuenta);
api.post('/cambiar_clave/:id/:old_password/:new_password', UserController.changePassword);


//api.post('/send-email-to-verification', UserController.sendEmailVerification);
api.get('/verification-of-email', UserController.verificationEmail);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth , UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth , UserController.getUsers);

api.get('/users-search/:search/:page?', md_auth.ensureAuth , UserController.searchUsers);
//api.get('/publications-user/:user/:page?', md_auth.ensureAuth, PublicationController.getPublicationsUser);

api.put('/update-user/:id', md_auth.ensureAuth , UserController.updateUser); // put para actualizar
api.post('/update-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth ,UserController.getCounts);


module.exports = api; //exportar todas las rutas