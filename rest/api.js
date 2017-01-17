const PATH = 'D:\\',
	  ROOT = 'Musicas',
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
var db         	= monk('localhost:27017/test');

module.exports = function(router) {
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
		const musicasCollection = db.get('musicas');
		musicasCollection.find({}, function (err, docs){ 
			res.json(docs);
		});
	});
};
