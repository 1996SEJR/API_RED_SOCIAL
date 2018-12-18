//DEFINICION DEL MODELO USUARIO

//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var UserSchema = Schema({
	//name: {type: String, required:true, maxlength:[10, "nombre muy grande"]},
	name: String,
	username: String,
	nick: String,
	email: String,
	password: String,
	role: String,
	image: String
});


//para poder utilizar el modelo fuera de este fichero
//en la base de datos se buscara la colección users ya que se User se pondrá en minuscula y se agregará la letra s
module.exports = mongoose.model('User', UserSchema); 