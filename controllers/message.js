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
	Message.find({receiver: userId}).populate('emmiter', 'name username _id nick image').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total)=>{
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
	Message.find({emmiter: userId}).populate('emmiter receiver', 'name username _id nick image').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total)=>{
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
function setViewedMessages2(req, res){
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

function setViewedMessages(req, res){
	var userId = req.user.sub;
	var id_emmiter = req.params.id; //id de la otra persona

	Message.update({emmiter: id_emmiter, receiver: userId, viewed:'false'}, {viewed:'true'}, {"multi": true}, (err, messagesUpdated)=>{
		if (err) {
			return res.status(500).send({message: 'Error en la petición'});
		}

		return res.status(200).send({
			messages: messagesUpdated
		});
	});
}

//mensajes enviados y recibidos
function getAllMessages(req, res){
	var userId = req.user.sub;

	var messages_clean = []; //ultimo mensaje entre emisor y receptor
	var message_save = true;
	var messages_no_viewed = 0;

	Message.find({ $or: [
		{emmiter: userId},
		{receiver: userId}
		]}).sort('-created_at').populate('emmiter receiver', '_id name username _id nick image').exec(function (err, allMessages) {
			if(err){
				return res.status(500).send({message: 'Error en el servidor ...'});
			}

			//console.log(allMessages[0].emmiter._id.toString() )
			
			allMessages.forEach((doc)=>{
				message_save = true;
				console.log('----------------')
				console.log(doc)
				console.log('---------------------')
				if(messages_clean.length != 0){
					for (let index = 0; index < messages_clean.length; index++) {
						if( (doc.emmiter._id.toString() == messages_clean[index].emmiter._id.toString() && 
						doc.receiver._id.toString() == messages_clean[index].receiver._id.toString()) || 
						(doc.receiver._id.toString() == messages_clean[index].emmiter._id.toString() && 
						doc.emmiter._id.toString() == messages_clean[index].receiver._id.toString()) ){
							message_save = false;
						}
					}
				}else{
					//messages_clean.push(doc)
					message_save = true;
				}
				if(message_save){
					messages_clean.push(doc)	
					if (doc.viewed == false || doc.viewed == "false") {
						messages_no_viewed = messages_no_viewed + 1;
					}
				}
			});

			return res.status(200).send({
				allMessages,
				messages_no_viewed,
				lastMessage: messages_clean
			});
	});
}

//interacción de mensajes con una personas
function getMessagesOnePeople(req, res){
	var userId = req.user.sub;
	var id_other = req.params.id; //id de la otra persona
	var name_other;
	var cont = 0;

	Message.find({
		$or: [
			{ $and: [{emmiter: userId}, {receiver: id_other}] },
			{ $and: [{receiver: userId}, {emmiter: id_other}] }
		]
		}).sort('created_at').populate('emmiter receiver', '_id name username _id nick image').exec(function (err, allMessages) {
			if(err){
				return res.status(500).send({message: 'Error en el servidor -> getMessagesOnePeople'});
			}

			//console.log(allMessages[0].emmiter)

			if(allMessages.length > 0){
				if(allMessages[cont].emmiter._id != userId){
					name_other = allMessages[cont].emmiter.name + ' ' + allMessages[cont].emmiter.username;
				}else{
					name_other = allMessages[cont].receiver.name + ' ' + allMessages[cont].receiver.username;
				}
			}
			//console.log(name_other)

			return res.status(200).send({
				allMessages,
				name_other,
				id_other
			});
	});
}

module.exports = {
	probando,
	saveMessage,
	getReceivedMessage,
	getEmmitMessage,
	getUnviewedMessages,
	setViewedMessages,
	getAllMessages,
	getMessagesOnePeople
}