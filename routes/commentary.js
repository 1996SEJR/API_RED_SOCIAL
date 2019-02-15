//DEFINICION DE RUTAS USUARIO

//utilizar nuevas características de javascript
'use strict'

var express = require('express');
var CommentaryController = require('../controllers/commentary');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();


api.post('/commentary', md_auth.ensureAuth , CommentaryController.saveCommentary);
api.delete('/commentary/:id', md_auth.ensureAuth , CommentaryController.deleteCommentary); //id hace referencia al campo PK de publicaciones
api.get('/commentary/:id_publication', md_auth.ensureAuth , CommentaryController.getComments);

module.exports = api; //exportar todas las rutas