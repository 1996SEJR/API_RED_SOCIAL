//DEFINICION DEL CONTROLADOR USUARIO

//utilizar nuevas características de javascript
'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user'); //cargar el modelo usuario
var Follow = require('../models/follow'); //cargar el modelo follow
var Publication = require('../models/publication'); //cargar el modelo follow
var jwt = require('../services/jwt'); //cargar el servicio

var fs = require('fs'); //libreria file sistem de node
var path = require('path'); //permite trabajar con rutas de sistemas de ficheros

var nodemailer = require("nodemailer"); //libreria para el envio de correos
var smtpTransport = nodemailer.createTransport({
	service: "Gmail",
	host: 'smtp.gmail.com',
	port: 465,
	secure: false,
    auth: {
        user: "ziquij96@gmail.com",
        pass: "1996ezequieljr*"
    }
});
var rand,mailOptions,host,link, email_usuario, url="http://localhost:4200/";

function home(req, res){
	res.status(200).send({
		message: 'Hola mundo desde el servidor node js'
	});
}

function pruebas(req, res) {
	console.log(req.body);
	res.status(200).send({
		message: 'Acción de pruebas  en el servidor node js'
	});
}

//REGISTRAR USUARIOS
function saveUser(req, res){
	var params = req.body;
	var user = new User();

	if (params.name && params.username && params.nick && params.email && params.password) {
		user.name = params.name;
		user.username = params.username;
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;
		user.active = false;

		//controlar usuario duplicados
		User.find({ $or: [
			{email: user.email.toLowerCase()},
			//{username: user.username.toLowerCase()},
			{nick: user.nick.toLowerCase()}
			]}).exec( (err, users) => {
				if (err) {
					return res.status(500).send({
						message: 'Error en la petición de usuario '  + String(err)
					}); 
				}

				if (users && users.length >= 1 ) {
					res.status(200).send({
						message: 'El usuario que intentas registrar ya existe'
					});
				}else{

					//encriptar password
					bcrypt.hash(params.password, null, null, (err, hash) => {
					user.password = hash;

					//guardar usuario
					user.save((err, userStored) => {
						if (err) {
							return res.status(500).send({
								message: 'Error al guardar el usuario ' + String(err)
							});
						}

						if (userStored) {
							sendEmailVerification(user.email, req.get('host'));
							res.status(200).send({
								user: userStored
							});
						}else{
							res.status(404).send({
								message: 'No se ha registrado el usuario'
							});
						}
					});
				});
				}
			});
	}else{
		/*if (!params.name){
			res.status(200).send({
				message: 'El campo nombre es obligatorio'
			});
		}*/
		
		res.status(200).send({
			message: 'Envía todos los campos'
		});
	}
}


//LOGIN
function loginUser(req, res){
	var params = req.body;
	var email = params.email;
	var password = params.password;

	User.findOne({email: email, active: true}, (err, user) => {
		if (err) {
			return res.status(500).send({message:"Error en la petición"});
		}

		if (user) {
			//password no está encriptada
			//user.password está encriptada
			//para comparar la contraseña usar bcrypt.compare ya que compara una password encriptada (de la BD) y otra sin encriptar (que viene desde el formulario)
			bcrypt.compare(password, user.password, (err, check) => {
				if (check) {
					if (params.gettoken) {
						//generar y devolver token
						return res.status(200).send({
							token: jwt.createToken(user)
						});

					}else{
						//devolver datos de usuario
						user.password = undefined; //no mostrar el password
						return res.status(200).send({user});					
					}
				}else{
					return res.status(404).send({message: "El usuario no se ha podido identificar"});
				}
			});
		}else{
			return res.status(404).send({message: "El usuario no se ha podido identificar!!!"});
		}
	});
}


//CONSEGUIR DATOS DE UN USUARIO
/* //antes del video 36 Async y Await
function getUser(req, res){
	var userId = req.params.id; //params para metodo get y body para metodo post
	User.findById(userId, (err, user) => {
		if (err) {
			return res.status(500).send({message:'Error en la petición'});			
		}
		if (!user) {
			return res.status(404).send({message: 'El usuario no existe'});
		}
		Follow.findOne({'user': req.user.sub, 'followed': userId}).exec((err, follow)=>{
			if (err) {
				return res.status(500).send({message: 'Error al comprobar el seguimiento'});
			}
			return res.status(200).send({user, follow});
		});
	});
}*/

//CONSEGUIR DATOS DE UN USUARIO
function getUser(req, res){
	var userId = req.params.id; //params para metodo get y body para metodo post
	User.findById(userId, (err, user) => {
		if (err) {
			return res.status(500).send({message:'Error en la petición'});			
		}
		if (!user) {
			return res.status(404).send({message: 'El usuario no existe'});
		}
		followThisUser(req.user.sub, userId).then((value) => {
			user.password = undefined;
			//console.log(value);
			return res.status(200).send({
				user,
				following: value.following,
				followed: value.followed
			});
		});

	});
}

//Función asincrona
//identify_user_id: usuario logueado
//user_id: usuario que se para por la url
async function followThisUser(identity_user_id, user_id) {
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });

        return {
            following: following,
            followed: followed
        }
    } catch (e) {
        console.log(e);
    }
}

async function followUserIds(user_id){
	try {
		var following = await Follow.find({ user: user_id }).select({'_id':0, '__v':0, 'user':0}).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });

        /*var following = await Follow.find({'user':user_id}).select({'_id':0, '__v':0, 'user':0}).exec((err, follows)=>{
			return follows;
		});*/
		var followed = await Follow.find({'followed': user_id}).select({'_id':0, '__v':0, 'follow':0}).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });


		/*var followed = await Follow.find({'followed': user_id}).select({'_id':0, '__v':0, 'follow':0 }).exec((err, follows)=>{
			return follows;
		});*/

		//procesar following ids
		var following_clean = [];
		following.forEach((follow)=>{
			following_clean.push(follow.followed);
		});

		//procesar followed ids
		var followed_clean = [];
		followed.forEach((follow)=>{
			followed_clean.push(follow.user);
		});

		return {
			following: following_clean,
			followed: followed_clean
		}
    } catch (e) {
        console.log(e);
    }
}

//DEVOLVER UN LISTADO DE USUARIOS - PAGINADO
function getUsers(req, res){
	var identify_user_id = req.user.sub;//recoger el id del usuario logueado
	var page = 1;
	
	if (req.params.page) {
		page = req.params.page;
	}

	var itemsPerPage = 6; //cantidad de usuarios que se listaran por pagina

	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if (err) {
			return res.status(500).send({message: 'Error en la petición'});
		}

		if (!users) {
			return res.status(404).send({message: 'No hay usuario disponibles'});			
		}

		followUserIds(identify_user_id).then((value)=>{
			return res.status(200).send({
				users,
				users_following: value.following, //usuarios que estamos siguiendo
				users_follow_me: value.followed, //usuario que nos siguen
				total,
				pages: Math.ceil(total/itemsPerPage)
			});
		});
	});
}


//Edición de datos de usuario
function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;

	//borrar propiedad password
	delete update.password;

	if (userId != req.user.sub) {
		return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
	}

	//controlar usuario duplicados
	User.find({ $or: [
		{email: update.email},
		{nick: update.nick}
		]}).exec( (err, users) => {
			var existe_usuario = false;

			users.forEach((user) => {
				if(user && user._id != userId){
					existe_usuario = true;
				}
			});

			if(existe_usuario){
				console.log('Los datos ya están en uso');
				return res.status(200).send({message: 'Los datos ya están en uso'});
			}

			//new:true => muestra info del usuario actualizada
			//new:false => muestra info del usuario desactualizada
			User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
				if (err) {
					return res.status(500).send({message: 'Error en la petición'});
				}
				if (!userUpdated) {
					return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
				}
				return res.status(200).send({user: userUpdated});
			});
		});
}


//Subir archivos de imagen/avatar de usuario
function uploadImage(req, res){
	var userId = req.params.id;

	if (req.files) { //si enviamos algun fichero
		// image corresponde al elemento del html
		var file_path = req.files.image.path; //path de la imagen que se quiere subir
		//console.log(file_path);

		var file_split = file_path.split('\\'); //cortar del path el nombre del archivo
		//console.log(file_split);

		var file_name = file_split[2]; //extrayendo el nombre de la imagen
		//console.log(file_name);

		var ext_split = file_name.split('\.'); 
		//console.log(ext_split);

		var file_ext = ext_split[1]; //obtener la extension del archivo
		//console.log(file_ext);

		if (userId != req.user.sub) { //el propio usuario podrá subir imagenes
			//colocar return para evitar problemas con la cabecera
			return removeFilesUploads(res, file_path, 'No tienes permiso para actualizar los datos');
		}

		if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
			//actualizar documentos de usuario	
			//new: true para que tras la actualización muestre el usuario con los datos actualizados
			//new:false para que tras la actualización muestre el usuario con los datos anteriores
			User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {
				if (err) {
					return res.status(500).send({message: 'Error en la petición'});
				}

				if (!userUpdated) {
					return res.status(404).send({message: 'No se ha podido actualizar'});
				}
				return res.status(200).send({user: userUpdated});
			});
		}else{
			//colocar return para evitar problemas con la cabecera
			return removeFilesUploads(res, file_path, 'Extensión no válida');
		}
	}else{
		return res.status(200).send({message: 'No se han subido imagenes'});
	}
}


function removeFilesUploads(res, file_path, message){
	fs.unlink(file_path, (err) => { //callback
		return res.status(200).send({message: message});
	});
}


//obtener la imagen
function getImageFile(req, res){
	var image_file = req.params.imageFile; //imageFile será un campo del formulario
	var path_file = "./uploads/users/" + image_file;

	fs.exists(path_file, (exists) => {
		if (exists) {
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen ...'});
		}
	});	
}


//obtener el numero de usuarios q sigo y usuarios q me siguen
function getCounts(req, res){
	var userId = req.user.sub;
	if (req.params.id) {
		userId = req.params.id;
	}

	getCountFollow(userId).then((value)=>{ //obtener el numero de usuario q sigo y usuarios q me siguen
		return res.status(200).send(value);
	});
}


//funcion asincrona: obtener el numero de usuario q sigo y usuarios q me siguen
async function getCountFollow(user_id){
	try {
		//collection.estimatedDocumentCount
		//collection.countDocuments
        var following = await Follow.countDocuments({ user: user_id }).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });

        var followed = await Follow.countDocuments({ followed: user_id }).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });

        var publications = await Publication.countDocuments({ user: user_id }).exec()
            .then((publications) => {
                return publications;
            })
            .catch((err) => {
                return handleError(err);
            });

		
        return {
            following: following,
            followed: followed,
            publications: publications
        }
    } catch (e) {
        console.log(e);
    }
}


function sendEmailVerification(email, hostname){
	//var params = req.body;
	console.log('');
	//console.log(params);
	console.log('sendEmailVerification');
	//console.log('');
	
	rand=Math.floor((Math.random() * 100) + 54);
	host=url;
	
	/*console.log('');
	console.log(host);
	console.log('');*/

	//link="http://"+hostname+"/api/verification-of-email?id="+rand;
	link= url + "verify?id=" + rand;
	email_usuario = email;
	//console.log('');
	//console.log(email_usuario);
	//console.log('');
	mailOptions={
		//from: "ziquij96@gmail.com",
		//to: "ziquij96@gmail.com",
		to : email,
		subject : "Please confirm your Email account",
		html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"	
	}

	console.log(mailOptions);
	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error){
			console.log('ocurre un error');
			console.log(error);
			//res.end("error");
			//return res.status(500).send({message: error});
		}else{
			//return res.status(200).send({message: "Message sent: " + response.message});
			console.log(message)
			console.log("Message sent: " + response.message);
			//res.end("sent");
		}
	});
}

function verificationEmail(req, res){
	//console.log(req.query.id);
	//console.log('');
	//console.log(email_usuario);
	//console.log('');

	//console.log(req.protocol+":/"+req.get('host'));
	//if((req.protocol+"://"+req.get('host'))==("http://"+host)){
		//console.log("Domain is matched. Information is from Authentic email");
	if(req.query.id==rand){
		console.log("email is verified");
		//res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");

		User.find({email: email_usuario.toLowerCase()}).exec( (err, users) => {
			if (err) {
				return res.status(500).send({
					message: 'Error en la petición de usuario '  + String(err)
				}); 
			}

			if (users && users.length >= 1 ) {
				console.log('')
				console.log(users[0]._id)
				console.log('')
				User.findByIdAndUpdate(users[0]._id, { $set: {active: true}}, {new:true}, (err, userUpdated) => {
					if (err) {
						return res.status(500).send({message: 'Error en la petición'});
					}
					if (!userUpdated) {
						return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
					}
					return res.status(200).send({user: userUpdated});
				});
			}
		});
	}
	else
	{
		console.log("email is not verified");
		res.end("<h1>Bad Request</h1>");
	}
	//}
	/*else
	{
		res.end("<h1>Request is from unknown source");
	}*/
}


module.exports = {
	home, 
	pruebas,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	updateUser,
	uploadImage,
	getImageFile,
	getCounts,
	sendEmailVerification,
	verificationEmail
}