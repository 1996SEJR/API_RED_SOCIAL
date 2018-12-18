//utilizar nuevas características de javascript
'use_strict'
var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_del_curso_de_red_social_con_node_angular_y_mongodb';

exports.ensureAuth = function (req, res, next) {

	if (!req.headers.authorization) {
		return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
	}

	var token = req.headers.authorization.replace(/['"]+/g, ''); //obtener el token y si el token tiene comillas quitarlas

	try{
		var payload = jwt.decode(token, secret);

		if (payload.exp <= moment().unix()) {
			return res.status(401).send({
				message: 'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(404).send({
			message: 'El token no es válido'
		});
	}

	//en los controladores se tiene acceso a req.user
	//y se tiene los datos del usuario q está enviando el token
	req.user = payload;

	//saltar a lo siguiente, a ejecutar node
	next();

};
