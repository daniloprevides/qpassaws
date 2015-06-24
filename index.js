var redis = require("redis");
var http = require('http');
var sockjs = require('sockjs');
var serviceList = {};
var clients = [];
var wsServer = sockjs.createServer();
var registeredServices = {};
var sub = redis.createClient();
var pub = redis.createClient();

sub.on("subscribe", function(channel, count) {
    console.log("Escutando no canal " + channel + ". Total de  " + count + " canais!");
});

var isFunction = function(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

sub.on("message", function(channel, message) {
	message = JSON.parse(message);
    //Caso exista alguma mensagem
    var cons = serviceList[message.service];
    if (cons != undefined){
    	//Caso seja uma função, significa que é um subscribe interno
    	cons.forEach(function(el,idx){
    		if (isFunction(el)){
    			el(message.data,message);
    		}else{
    			el.write(JSON.stringify(message));	
    		}
    		
    	});
    }
});



//adicionando serviços padrões em registeredServices
registeredServices['/list'] = function(data,resp, item){
    var names = [];
    for (var key in registeredServices) {
      names.push(key);
    }
    resp(names);
}



wsServer.on('connection', function(conn) {
  //Criando uma lista d e clients
  clients.push(conn);
 
 

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
				sub.unsubscribe(message.service);
	    	break;
        case 'get':
        if (registeredServices[message.service] != undefined){
        	 var response = {};
			  response.conn = conn;
			  response.write = function(data){
			    var ret  = {}
			    ret.service = message.service;
			    ret.type = 'GET';
			    ret.data = data;
			    response.conn.write(JSON.stringify(ret));
			  };
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


exports.listen = function(server,prefix,port){
	wsServer.installHandlers(server, {prefix: prefix});
	server.listen(port);
}

exports.registerService = function(serviceName,callback){
	registeredServices[serviceName] = callback;
}

exports.unregisterService = function(serviceName,callback){
	delete registeredServices[serviceName];
}

exports.publish = function(serviceName,data){
	var item = {service : serviceName, data: data, type:'LOCAL'};
	pub.publish(serviceName,JSON.stringify(item));
}

exports.subscribe = function(serviceName,callback){
	if (serviceList[serviceName] == undefined){
		serviceList[serviceName] = [];
	}
	serviceList[serviceName].push(callback);
	sub.subscribe(serviceName);	 
}

exports.unsubscribe = function(serviceName){
	delete serviceList[serviceName];
	sub.unsubscribe(serviceName);
}
