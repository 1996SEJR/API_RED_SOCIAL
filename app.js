//SERVIDOR WEB UTILIZANDO EXPRESS

//CONFIGURACION DE EXPRESS
//utilizar nuevas características de javascript
'use strict'

var express = require('express'); //esto permite trabajar con rutas, protocolo http, etc...

var bodyParser = require('body-parser'); //convertir las peticiones en un objeto de javascript

var app = express();//cargar el framework

//cargar rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var like_routes = require('./routes/like');
var commentary_routes = require('./routes/commentary');

//cargar middlewares
app.use(bodyParser.urlencoded({extended:false})); //crear un middleware (middleware: metodo que se ejecuta antes de que llegue a un controlador)
app.use(bodyParser.json()); 

//cargar cors (cabeceras)
// configurar cabeceras http
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


//rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', like_routes);
app.use('/api', commentary_routes);

//app.use(user_routes);

//exportar configuracion
module.exports = app;