//DEFINICION DE RUTAS USUARIO

//utilizar nuevas características de javascript
'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();


api.get('/probando_message', md_auth.ensureAuth , MessageController.probando);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', md_auth.ensureAuth , MessageController.getReceivedMessage);
api.get('/messages/:page?', md_auth.ensureAuth , MessageController.getEmmitMessage);
api.get('/unviewed-messages', md_auth.ensureAuth , MessageController.getUnviewedMessages);
api.get('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);


module.exports = api; //exportar todas las rutas