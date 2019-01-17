//DEFINICION DE RUTAS USUARIO

//utilizar nuevas características de javascript
'use strict'

var express = require('express');
var LikeController = require('../controllers/like');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();


//api.get('/probando', md_auth.ensureAuth , LikeController.probando);
api.post('/saveLike', md_auth.ensureAuth, LikeController.saveLike);
api.delete('/like/:id', md_auth.ensureAuth , LikeController.deleteLike);
api.get('/liking/:id?/:page?', md_auth.ensureAuth , LikeController.getLikingUser);

module.exports = api; //exportar todas las rutas