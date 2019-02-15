//DEFINICION DEL MODELO LIKES

//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var LikeSchema = Schema({
	user: { type: Schema.ObjectId, ref:'User' }, 
	publication: { type: Schema.ObjectId, ref:'Publication' } 
});


//para poder utilizar el modelo fuera de este fichero
module.exports = mongoose.model('Like', LikeSchema); 