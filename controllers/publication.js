'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
	res.status(200).send({
		message: "Hola desde el controlador de publicaciones"
	});
}

function savePublication(req, res){
	var params = req.body;

	if (!params.text) {
		return res.status(200).send({message: 'Debes enviar un texto'});
	}

	var publication = new Publication();
	publication.text = params.text;
	publication.file = 'null';
	publication.user = req.user.sub; //usuario logueado
	publication.created_at = moment().unix();

	publication.save((err, publicationStored)=>{
		if (err) {
			return res.status(500).send({message: 'Error al guardar la publicación'});
		}

		if (!publicationStored) {
			return res.status(404).send({message: 'La publicación no ha sido guardada'})
		}
		return res.status(200).send({publication: publicationStored});
	});	
}


//volverme todas las publicaciones de los usuarios que sigo
function getPublications(req, res){
	var page = 1;
	if (req.params.page) {
		page = req.params.page // se pasa el valor por la  url
	}

	var itemsPerPage = 4;

	//buscar todos los follows (usuario que estamos siguiendo)
	Follow.find({user: req.user.sub}).populate('followed').exec((err, follows)=>{
		if (err) {
			return res.status(500).send({message: 'Error al devolver el seguimiento'});
		}

		var follows_clean = []; //array con los usuarios que estamos siguiendo

		follows.forEach((follow)=>{
			follows_clean.push(follow.followed);
		});
		follows_clean.push(req.user.sub);
		
		//console.log(follows);
		//console.log(follows_clean);

		//buscar publicaciones de los usuarios a los que seguimos
		Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total)=>{
			if (err) {
				return res.status(500).send({message: 'Error devolver publicaciones'});
			}

			if (!publications) {
				return res.status(404).send({message: 'No hay publicaciones'});
			}
			//console.log(publications);

			return res.status(200).send({
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page: page,
				publications: publications
			});
		});
	});
}

//obtener publicaciones de un usuario en especifico
function getPublicationsUser(req, res){
	var page = 1;
	var user = req.user.sub;

	if (req.params.page) {
		page = req.params.page // se pasa el valor por la  url
	}

	if(req.params.user){
		user = req.params.user;// recogiendo parametro que se envia por la url
	}

	var itemsPerPage = 4;

	Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error devolver publicaciones'});
		}

		if (!publications) {
			return res.status(404).send({message: 'No hay publicaciones'});
		}
		//console.log(publications);

		return res.status(200).send({
			total_items: total,
			pages: Math.ceil(total/itemsPerPage),
			page: page,
			publications: publications
		});
	});
}

function getPublication(req, res){
	var publicationId = req.params.id;

	Publication.findById(publicationId, (err, publication)=>{
		if (err) {
			return res.status(500).send({message: 'Error al devolver la publicacion'});
		}

		if (!publication) {
			return res.status(404).send({message:'No existe la publicación'});
		}

		return res.status(200).send({publication});
	});
}

function deletePublication(req, res){
	var publicationId = req.params.id;
	console.log(req.user.sub);

	Publication.findOneAndDelete({'user': req.user.sub, '_id': publicationId}, (err, publication) => {
		if (err) {
			return res.status(500).send({message: 'Error al borrar la publicacion'});
		}
		console.log(publication);
		if (!publication) {
			return res.status(404).send({message: 'La publicación no existe'});
		}
		return res.status(200).send({message: 'La publicación se ha eliminado'});
	});
}


//Subir archivos de imagen/avatar de usuario
function uploadImage(req, res){
	var publicationId = req.params.id;

	if (req.files) { //si enviamos algun fichero
		// image corresponde al elemento del html
		var file_path = req.files.file.path; //path de la imagen que se quiere subir
		var file_split = file_path.split('\\'); //cortar del path el nombre del archivo
		var file_name = file_split[2]; //extrayendo el nombre de la imagen
		var ext_split = file_name.split('\.'); 
		var file_ext = ext_split[1]; //obtener la extension del archivo

		if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
			//actualizar documentos de la publicacion	
			//new: true para que tras la actualización muestre el usuario con los datos actualizados
			//new:false para que tras la actualización muestre el usuario con los datos anteriores
			Publication.findOneAndUpdate( {'_id':publicationId, 'user':req.user.sub }, {file: file_name}, {new:true}, (err, publicationUpdated) => {
				if (err) {
					return res.status(500).send({message: 'Error en la petición'});
				}

				if (!publicationUpdated) {
					return res.status(404).send({message: 'No se ha podido actualizar'});
				}
				return res.status(200).send({publication: publicationUpdated});
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
	var path_file = "./uploads/publications/" + image_file;

	fs.exists(path_file, (exists) => {
		if (exists) {
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen ...'});
		}
	});	
}

module.exports = {
	probando,
	savePublication,
	getPublications,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile,
	getPublicationsUser
}