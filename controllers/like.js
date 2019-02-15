'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var Like = require('../models/like');


function saveLike(req, res){
	var params = req.body;

	var like = new Like();
	like.user = req.user.sub; // el usuario logueado

	if (params.publication) {
		like.publication = params.publication;

		like.save((err, likeStored) => {
			if (err) {
				return res.status(500).send({message: 'Error al guardar el like'});
			}

			if (!likeStored) {
				return res.status(404).send({message: 'El like no se ha guardado'});
			}

			//new:true => muestra info del usuario actualizada
			//new:false => muestra info del usuario desactualizada

			Like.countDocuments({ publication: like.publication}, function (err, count) {
				Publication.findByIdAndUpdate(like.publication, { number_likes: count }, {new:true}, (err, userUpdated) => {
					if (err) {
						return res.status(500).send({message: 'Error en la petición'});
					}
					if (!userUpdated) {
						return res.status(404).send({message: 'No se ha podido actualizar la publicacion'});
					}
					return res.status(200).send({user: userUpdated, like: likeStored});
				});
			}); 			

			//return res.status(200).send({like: likeStored});
		});
	}
	else{
		res.status(200).send({
			message: 'Envía todos los campos'
		});
	}	
}


function deleteLike(req, res){
	var userId = req.user.sub;
	var publication = req.params.id;

	Like.findOneAndDelete({'user': userId, 'publication': publication}, (err, like) => {
		if (err) {
			return res.status(500).send({message: 'Error al dejar de dar like'});
		}

		if (!like) {
			console.log('ho hay ningun like')
			return res.status(200).send({message: 'Usted no le gusta este comentario'});
		}else{
			Like.countDocuments({ publication: publication}, function (err, count) {
				console.log('count: '+count)
	
				Publication.findByIdAndUpdate(publication, { number_likes: count }, {new:true}, (err, userUpdated) => {
					if (err) {
						return res.status(500).send({message: 'Error en la petición'});
					}
					
					if (!userUpdated) {
						return res.status(404).send({message: 'No se ha podido actualizar la publicacion'});
					}
					return res.status(200).send({user: userUpdated, message: 'El like se ha eliminado'});
				});
			});
		}
		//return res.status(200).send({message: 'El like se ha eliminado'});

		
		//return res.status(200).send({message: 'El like se ha eliminado'});
	});
}


function getLikingUser(req, res){ 
	var userId = req.user.sub;//recoger el usuario logueado
	var page = 1;

	//comprobar si llega por la url un id de usuario
	if (req.params.id && req.params.page) { // si en la url existen los 2 datos (id y page)
		userId = req.params.id;
		page = req.params.page;
		//console.log('id y page')
	}else{
		//comprobar si llega la pagina por la url
		if (req.params.page) { //si en la url existe el campo page
			page = req.params.page;
			//console.log('if page')
			
		}else{
			//console.log('else page')			
			page = req.params.id;
		}
	}
	
	var itemsPerPage = 4; //listar 4 usuarios por pagina

	//populate: mostrar los datos del objeto publication
	Like.find({user: userId}).populate({path: 'publication'}).paginate(page, itemsPerPage, (err, likes, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!likes) {
			return res.status(404).send({message: 'No has dado ningun like'});
		}
		//console.log('follows')
		console.log(likes)

		//followUserIds(req.user.sub).then((value)=>{
		likeUserIds(userId).then((value)=>{
			return res.status(200).send({
				total: total, //total de documentos q devuelve Follow.find
				pages: Math.ceil(total/itemsPerPage), //redondear al entero superior el numero de paginas
				likes, //propiedad con todos los likes
				publication_like: value.liking //id de las publicaciones que nos gustan
			});
		});
	});
}

async function likeUserIds(user_id){
	try {
		var liking = await Like.find({ user: user_id }).select({'_id':0, '__v':0, 'user':0}).exec()
            .then((liking) => {
                return liking;
            })
            .catch((err) => {
                return handleError(err);
            });

		//procesar liking ids
		var liking_clean = [];
		liking.forEach((like)=>{
			liking_clean.push(like.publication);
		});

		console.log(liking_clean)

		//console.log('following')
		//console.log(following_clean)
		return {
			liking: liking_clean
		}
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
	saveLike,
	deleteLike,
	getLikingUser
}