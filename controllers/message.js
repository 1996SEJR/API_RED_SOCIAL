'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probando(req, res){
	res.status(200).send({message: 'Hola desde el controlador de mensajes'});
}


function saveMessage(req, res){
	var params = req.body;
	if (!params.text || !params.receiver) {
		res.status(200).send({message: 'Envía los datos necesarios'});
	}

	var message = new Message();
	message.text = params.text;
	message.receiver = params.receiver;
	message.emmiter = req.user.sub;
	message.created_at = moment().unix();
	message.viewed = 'false';

	message.save((err, messageStored)=>{
		if (err) {
			return res.status(500).send({message: 'Error al guardar el mensaje'});
		}

		if (!messageStored) {
			return res.status(404).send({message: 'El mensaje no ha sido guardado'})
		}
		return res.status(200).send({message: messageStored});
	});
}

//mensajes recibidos
function getReceivedMessage(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4;

	if (req.params.page) {
		page = req.params.page;
	}

	//el 2do parametro en el populate indica que
	//solo se devuelvan dichos campos
	Message.find({receiver: userId}).populate('emmiter', 'name username _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!messages) {
			return res.status(404).send({message: 'No hay mensajes'});
		}

		return res.status(200).send({
			total: total, //total de documentos q devuelve Follow.find
			pages: Math.ceil(total/itemsPerPage), //redondear al entero superior el numero de paginas
			messages //propiedad con todos los follows
		});
	});
}


//mensajes enviados
function getEmmitMessage(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4;

	if (req.params.page) {
		page = req.params.page;
	}

	//el 2do parametro en el populate indica que
	//solo se devuelvan dichos campos
	Message.find({emmiter: userId}).populate('emmiter receiver', 'name username _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		if (!messages) {
			return res.status(404).send({message: 'No hay mensajes'});
		}

		return res.status(200).send({
			total: total, //total de documentos q devuelve Follow.find
			pages: Math.ceil(total/itemsPerPage), //redondear al entero superior el numero de paginas
			messages //propiedad con todos los follows
		});
	});
}


//mensajes que no he leido
function getUnviewedMessages(req, res){
	var userId = req.user.sub;

	Message.countDocuments({receiver:userId, viewed:'false'}).exec((err, count)=>{
		if (err) {
			return res.status(500).send({message: 'Error en el servidor'});
		}

		return res.status(200).send({
			'unviewed': count
		});
	});
}


//actualizar mensajes sin leer
function setViewedMessages(req, res){
	var userId = req.user.sub;

	Message.update({receiver:userId, viewed:'false'}, {viewed:'true'}, {"multi": true}, (err, messagesUpdated)=>{
		if (err) {
			return res.status(500).send({message: 'Error en la petición'});
		}

		return res.status(200).send({
			messages: messagesUpdated
		});
	});
}

module.exports = {
	probando,
	saveMessage,
	getReceivedMessage,
	getEmmitMessage,
	getUnviewedMessages,
	setViewedMessages
}