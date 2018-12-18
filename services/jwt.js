//utilizar nuevas características de javascript
'use_strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_del_curso_de_red_social_con_node_angular_y_mongodb';

exports.createToken = function (user) {
	//todos los datos se van a encriptar en un token
	var payload = { //generar un token
		sub: user._id,
		name: user.name,
		username: user.username,
		nick: user.nick,
		email: user.email,
		role: user.role,
		image: user.image,
		iat: moment().unix(), //fecha de creacion del token
		exp: moment().add(30, 'days').unix //fecha de expiración
	};

	return jwt.encode(payload, secret);
};
