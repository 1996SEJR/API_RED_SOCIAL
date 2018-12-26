'use strict'

var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res){
	var params = req.body;

	var follow = new Follow();
	follow.user = req.user.sub; // el usuario logueado

	if (params.followed) {
		follow.followed = params.followed;

		follow.save((err, followStored) => {
			if (err) {
				return res.status(500).send({message: 'Error al guardar el seguimiento'});
			}

			if (!followStored) {
				return res.status(404).send({message: 'El seguimiento no se ha guardado'});
			}
			return res.status(200).send({follow: followStored});
		});
	}
	else{
		res.status(200).send({
			message: 'Envía todos los campos'
		});
	}	
}

function deleteFollow(req, res){
	var userId = req.user.sub;
	var followId = req.params.id;

	Follow.findOneAndDelete({'user': userId, 'followed': followId}, (err, follow) => {
		if (err) {
			return res.status(500).send({message: 'Error al dejar de seguir'});
		}
		console.log(follow);
		
		if (!follow) {
			return res.status(404).send({message: 'Usted no sigue a este usuario'});
		}
		return res.status(200).send({message: 'El follow se ha eliminado'});
	});
}

//listado paginado de los usuarios que estamos siguiendo
function getFollowingUsers(req, res){ 
	var userId = req.user.sub;//recoger el usuario logueado
	var page = 1;

	//comprobar si llega por la url un id de usuario
	if (req.params.id && req.params.page) { // si en la url existen los 2 datos (id y page)
		userId = req.params.id;
		page = req.params.page;
		//console.log('ey')
	}else{
		//comprobar si llega la pagina por la url
		if (req.params.page) { //si en la url existe el campo page
			page = req.params.page;
		}else{
			page = req.params.id;
		}

	}
	
	var itemsPerPage = 4; //listar 4 usuarios por pagina

	//buscar todos follows cuyo usuario sea userId 
	//populate: mostrar los datos del objeto followed
	Follow.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!follows) {
			return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});
		}
		//console.log('follows')
		//console.log(follows)


		//followUserIds(req.user.sub).then((value)=>{
		followUserIds(userId).then((value)=>{
			return res.status(200).send({
				total: total, //total de documentos q devuelve Follow.find
				pages: Math.ceil(total/itemsPerPage), //redondear al entero superior el numero de paginas
				follows, //propiedad con todos los follows
				users_following: value.following, //usuarios que estamos siguiendo
				users_follow_me: value.followed //usuario que nos siguen

			});
		});

		
	});
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

		//console.log('following')
		//console.log(following_clean)
		return {
			following: following_clean,
			followed: followed_clean
		}
    } catch (e) {
        console.log(e);
    }
}


//listado paginado de los usuarios que nos siguen
function getFollowedUsers(req, res){ 
	var userId = req.user.sub;//recoger el usuario logueado
	//comprobar si llega por la url un id de usuario
	if (req.params.id && req.params.page) { // si en la url existen los 2 datos (id y page)
		userId = req.params.id;
	}

	var page = 1;

	//comprobar si llega la pagina por la url
	if (req.params.page) { //si en la url existe el campo page
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	var itemsPerPage = 4; //listar 4 usuarios por pagina

	//buscar todos follows cuyo usuario sea userId 
	//populate: mostrar los datos del objeto user
	Follow.find({followed: userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!follows) {
			return res.status(404).send({message: 'No tienen ningun seguidor'});
		}

		return res.status(200).send({
			total: total, //total de documentos q devuelve Follow.find
			pages: Math.ceil(total/itemsPerPage), //redondear al entero superior el numero de paginas
			follows //propiedad con todos los follows
		});
	});
}


//Devolver usuario que sigo
//Devolver usuarios que me siguen
function getMyFollows(req, res){
	var userId = req.user.sub;

	var find = Follow.find({user:userId}); //devolver usuarios que sigo

	if (req.params.followed) { // si se envias por la url followed
		find = Follow.find({followed: userId}); //devolver los usuarios que me siguen
	}

	find.populate('user followed').exec((err, follows)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!follows) {
			return res.status(404).send({message: 'No sigues ningun usuario'});		
		}

		return res.status(200).send({follows});
	});
}

module.exports = {
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows

}