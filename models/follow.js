//DEFINICION DEL MODELO FOLLOW

//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var FollowSchema = Schema({
	user: { type: Schema.ObjectId, ref:'User' }, //usuario que sigue
	followed: { type: Schema.ObjectId, ref:'User' } //usuario seguido
});

//para poder utilizar el modelo fuera de este fichero
module.exports = mongoose.model('Follow', FollowSchema); 