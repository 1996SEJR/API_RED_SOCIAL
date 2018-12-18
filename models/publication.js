//DEFINICION DEL MODELO PUBLICACIONES

//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var PublicationSchema = Schema({
	text: String,
	file: String,
	created_at: String,
	user: { type: Schema.ObjectId, ref:'User' }
});


//para poder utilizar el modelo fuera de este fichero
module.exports = mongoose.model('Publication', PublicationSchema); 