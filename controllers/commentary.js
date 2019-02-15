'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Commentary = require('../models/commentary');
var Publication = require('../models/publication');

function saveCommentary(req, res){
	//req.body = datos que viene desde un formulario
	//req.params = datos que viene desde la url
	var params = req.body;

	var commentary = new Commentary();
	commentary.user = req.user.sub; // el usuario logueado

	if (params.publication && (params.text || params.file) ){
		commentary.publication = params.publication;
		commentary.text = params.text;
		commentary.file = params.file;
		commentary.created_at = moment().unix();

		console.log(commentary)

		commentary.save((err, commentaryStored) => {
			if (err) {
				return res.status(500).send({message: 'Error al guardar el comentario'});
			}

			if (!commentaryStored) {
				return res.status(404).send({message: 'El comentario no se ha guardado'});
			}

			//new:true => muestra info del usuario actualizada
			//new:false => muestra info del usuario desactualizada

			Commentary.countDocuments({ publication: commentary.publication}, function (err, count) {
				Publication.findByIdAndUpdate(commentary.publication, { number_publications: count }, {new:true}, (err, userUpdated) => {
					if (err) {
						return res.status(500).send({message: 'Error en la petición'});
					}
					if (!userUpdated) {
						return res.status(404).send({message: 'No se ha podido actualizar la publicacion'});
					}
					return res.status(200).send({user: userUpdated, commentary: commentaryStored});
					//return res.status(200).send({commentary: commentaryStored});
				});
			});
		});
	}
	else{
		res.status(200).send({
			message: 'Envía todos los campos'
		});
	}	
}

function deleteCommentary(req, res){
	var userId = req.user.sub; //usuario logueado
	var publication = req.params.id; //este dato viene por la url

	Commentary.findOneAndDelete({'user': userId, 'publication': publication}, (err, commentary) => {
		if (err) {
			return res.status(500).send({message: 'Error al eliminar el comentario'});
		}		
		if (!commentary) {
			return res.status(200).send({message: 'Usted no puede eliminar este comentario'});
		}else{
			return res.status(200).send({message: 'El comentario se ha eliminado'});
		}
	});
}


function getComments(req, res){
	var publicacion = req.params.id_publication; //params para metodo get y body para metodo post

	Commentary.find({publication: publicacion}).populate('user').exec( (err, commentary) => {
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		console.log(commentary)

		if (!commentary) {
			return res.status(404).send({message: 'No has hecho ningun comentario'});
		}

		return res.status(200).send({
			commentary
		});
	});
}




module.exports = {
	saveCommentary,
	deleteCommentary,
	getComments
}