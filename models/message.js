//DEFINICION DEL MODELO MENSAJES

//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var MessageSchema = Schema({
	text: String,
	viewed: String,
	created_at: String,
	emmiter: { type: Schema.ObjectId, ref:'User' },
	receiver: { type: Schema.ObjectId, ref:'User' }
});


//para poder utilizar el modelo fuera de este fichero
module.exports = mongoose.model('Message', MessageSchema); 