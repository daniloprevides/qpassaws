var redis = require("redis");
var http = require('http');
var sockjs = require('sockjs');


var pub = redis.createClient();
var sub = redis.createClient();

sub.on("subscribe", function(channel, count) {
    console.log("Escutando no canal " + channel + ". Total de  " + count + " canais!");
});

sub.on("message", function(channel, message) {
	message = JSON.parse(message);
    //Caso exista alguma mensagem
    var cons = serviceList[message.service];
    if (cons != undefined){
    	cons.forEach(function(el,idx){
    		el.write(JSON.stringify(message));
    	});
    }
});



var serviceList = {};
var clients = [];
var wsServer = sockjs.createServer();
var registeredServices = {};


//adicionando serviços padrões em registeredServices
registeredServices['/list'] = function(data,resp, item){
    var names = [];
    for (var key in registeredServices) {
      names.push(key);
    }
    resp(names,'/list');
}


//Registrando alguns serviços
registeredServices['/servico1'] = function(data,resp, item){
  resp('Resposta de servico 1 ' + data,item.service);
};



wsServer.on('connection', function(conn) {
  //Criando uma lista d e clients
  clients.push(conn);
 
  var response = {};
  response.conn = conn;
  response.write = function(data,service){
    var ret  = {}
    ret.service = service;
    ret.type = 'GET';
    ret.data = data;
    response.conn.write(JSON.stringify(ret));
  };

  // Ouvindo todas as conexões
  conn.on('data', function(message) {
    //Message é um objeto com as caracteristicas
    //{ type: 'PUB/SUB/UNSUB', service: '/caminho', data: 'valor'}
    try {
    	message = JSON.parse(message);	
    }catch(ex){
    	console.log(ex);
    }
    
    if (message.type == undefined){
    	conn.write('{error: "Formato da mensagem de transporte errado!"}');    	
    }else{
    	
    	
	    switch(message.type.toLowerCase()){
	    	case 'pub':
	    		pub.publish(message.service,JSON.stringify(message));
	    	break;
	    	case 'sub':
	    		if (serviceList[message.service] == undefined){
	    			serviceList[message.service] = [];
	    		}
	    		serviceList[message.service].push(conn);
	    		sub.subscribe(message.service);	    	
	    	break;
	    	case 'unsub':
				//devo buscar por todos os serviços o cliente e remover ele da lista
				var pubs =  serviceList[message.service];
				if (pubs != undefined){
					pubs.splice(pubs.indexOf(conn), 1);	
				}
	    	break;
        case 'get':
        if (registeredServices[message.service] != undefined){
          var fn = registeredServices[message.service];
          fn(message.data,response.write,message);
        }
        break;

        case 'list':
          var resp = { type: 'LIST', service: 'LIST' };
          var names = [];
          for (var key in registeredServices) {
            names.push(key);
          }
          resp.data = names;
          conn.write(JSON.stringify(resp));
        break;
	    }
    }


  });
 
  // Removendo o usuário da lista de conexões
  conn.on('close', function() {
  	//devo buscar por todos os serviços o cliente e remover ele da lista
  	for(var service in serviceList) {
		for (var key in serviceList) {
			serviceList[key].splice(serviceList[key].indexOf(conn), 1);		
    		console.log('removendo ' + conn);
		}
	}
	//fechando a conexão do cliente
	clients.splice(clients.indexOf(conn), 1);	
  });
});
 
// Begin listening.
var server = http.createServer();
wsServer.installHandlers(server, {prefix: '/ws'});
server.listen(573);


