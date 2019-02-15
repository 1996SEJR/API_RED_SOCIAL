//FICHERO PRINCIPAL DEL API
//por aqui van a pasar las peticiones



/* CONEXION DE NODEJS CON MONGODB */
//utilizar nuevas características de javascript
'use strict'

//cargar la libreria de mongoose
var mongoose = require('mongoose');
//var mongoose2 = require('mongoose');

//cargar app.js
var app = require('./app');
//var app2 = require('./app');
var port = 3800;
//var port2 = 3801;

//conexion a la base de datos
mongoose.Promise = global.Promise;
//mongoose2.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/MyFriends',  {useNewUrlParser: true })
//mongodb://<dbuser>:<dbpassword>@ds161134.mlab.com:61134/curso_red_social
//mongoose.connect('mongodb://SEJR:1996SEJR-jr*@ds161134.mlab.com:61134/curso_red_social',  {useNewUrlParser: true })
	.then(() => {
		console.log('La conexion a la base de datos curso_red_social se ha realizado de forma correcta!! :D');

		//crear servidor
		app.listen(port, () => {
			console.log("Servidor ejecutandose en http://localhost:3800");
		});
	})
	.catch(err => console.log(err) );

	/*
mongoose2.connect('mongodb://localhost:27017/curso_red_social',  {useNewUrlParser: true })
	.then(() => {
		console.log('La conexion a la base de datos curso_red_social se ha realizado de forma correcta!! :D');

		//crear servidor
		app2.listen(port2, () => {
			console.log("Servidor ejecutandose en http://localhost:3801");
		});
	})
	.catch(err => console.log(err) );
	*/