const PATH = 'C:\\simple-player-front\\',
	  ROOT = 'musicas',
	  ROOT_PATH = PATH + ROOT;

// funções auxiliares
function strPadLeft(string,pad,length) {
    return (new Array(length+1).join(pad)+string).slice(-length);
}

function retornarSoOsMp3(arquivos){
	var mp3Files = [];
	arquivos.forEach(function(elem){
		if(elem.toUpperCase().endsWith(".MP3")){
			mp3Files.push(elem);
		}
	});
	return mp3Files;
}

var fs 		   	= require('fs');
var path       	= require('path');

var mongo 	   	= require('mongodb');
var monk 	   	= require('monk');
var db         	= monk('localhost:27017/simpleplayer');

var jsmediatags = require("jsmediatags");
var id3 = require('id3js');

module.exports = function(router) {

	function lerAndSalvarMp3(arquivo, salvarNoMongo){
		id3({ file: arquivo, type: id3.OPEN_LOCAL }, function(err, tags) {
			console.log(err);
		    salvarMp3({arquivo: arquivo, tags: tags})
		});


		//tags = jsmediatags.readSync(arquivo);
		
		/*jsmediatags.read(arquivo, {
		  onSuccess: function(tag) {
		  	//console.log("arquivo: "+ arquivo +" OK");
		    salvarMp3({arquivo: arquivo, tags: tag });
		  },
		  onError: function(error) {
		  	console.log("arquivo: "+arquivo+" erro:"+ JSON.stringify(error));
		  	salvarMp3({arquivo: arquivo}); return;
		  }
		});*/
	}

	function salvarMp3(mp3, arquivo){
		console.log("salvando: "+arquivo);
		const musicasCollection = db.get('musicas');
		musicasCollection.insert(mp3);
	}

	function recuperarTodosMp3(){
		const musicasCollection = db.get('musicas');
		musicasCollection.find({}, function (err, docs){ 
			res.json(docs);
		});
	}

	/**
	  * Função responsável por carregar todos os arquivos mp3 no banco de dados mongobd
	  */
	function salvarNoMongo(pasta){
		fs.readdirSync(pasta).forEach((elem, idx, array) => {
			var filho = pasta + "/" + elem;
			if(fs.lstatSync(filho).isDirectory()){
				console.log('importando: '+ elem);
				salvarNoMongo(filho);
			} else if(filho.toUpperCase().endsWith(".MP3")){
				lerAndSalvarMp3(filho, salvarMp3);
			}
		});
	}

	/**
	  * Função responsável por carregar todos os arquivos mp3 no banco de dados mongobd
	  */
	function recuperarArquivosMp3(pasta){
		var listaMp3 = [];
		fs.readdirSync(pasta).forEach(elem => {
			var filho = pasta + "/" + elem;


			if(fs.lstatSync(filho).isDirectory()){
				listaMp3 = listaMp3.concat(recuperarArquivosMp3(filho));

			// é um mp3 ?
			} else if(filho.toUpperCase().endsWith(".MP3")){
				listaMp3.push({
					arquivo : filho
				});
			}
		});
		return listaMp3;
	}

  	router.get('/pasta', function(req, res) {
		var caminho = req.query.p;

		var diretorio = ROOT_PATH + caminho;
		if(caminho === undefined || caminho == '/..'){
			diretorio = ROOT_PATH;
			caminho = '';
		} else if(caminho.endsWith('/..')){
			var caminhosSeparados = caminho.split('/');
			
			caminho = "";
			caminhosSeparados.forEach(function(elem, idx, array) {
				if(idx >= array.length - 2 || idx == 0){
					return;
				}	

				caminho += "/"+elem;		
			});
		}
		
		console.log(diretorio);

		var caminhos = [];
		caminhos.push({ pasta : caminho+ '/..' });
		console.log("["+req.connection.remoteAddress+"] acessando diretorio: " + diretorio);
		if(fs.lstatSync(diretorio).isDirectory()){
			var listaDePastas = fs.readdirSync(diretorio);
		
			listaDePastas.forEach(elem => {
				var pasta = caminho + "/" + elem;
				if(fs.lstatSync(ROOT_PATH + pasta).isDirectory()){
					caminhos.push({
						pasta : pasta
					});
				}
			});

			res.json(caminhos);
		}
	});

	router.get('/playlist', function(req, res) {
		var caminho = req.query.p;
		if(caminho === undefined){
			res.json();
			return;
		}
		caminho = caminho.replace("/..", '');
		console.log("["+req.connection.remoteAddress+"] acessando playlist: " + caminho);

		var diretorio = ROOT_PATH + '/' + caminho;
		if(fs.lstatSync(diretorio).isDirectory()){
			var listaDeArquivos = fs.readdirSync(diretorio);
			var listaDeMp3 = retornarSoOsMp3(listaDeArquivos);
			var arquivosArray = [];
			listaDeMp3.forEach(function(elem, idx, array) {
				var arquivo = ROOT + "/" + caminho + "/" + elem;
				var track = {
									"name" : path.basename(arquivo),
									"file" : arquivo
							};

				arquivosArray.push(track);
			});
			res.json(arquivosArray);
		} else {
			res.json();
		}
	});

	router.get('/mongo', function(req, res) {
		const tabela = db.get('tabela');
		tabela.insert({nome: 'simpleplayer'});
		tabela.find({}, function (err, docs){ 
			res.json(docs);
		});
	});

	router.get('/salvarmp3', function(req, res) {
		salvarNoMongo(ROOT_PATH+"\\Sertanejo");
		res.json("ok");
	});

	router.get('/arquivosmp3', function(req, res) {
		res.json(recuperarArquivosMp3(ROOT_PATH+"\\Bandas\\ACDC"));
	});
};
