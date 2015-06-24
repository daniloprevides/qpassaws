var http = require('http');
var qpassa = require('./index.js')
 
// Begin listening.
var server = http.createServer();
qpassa.listen(server,'/ws',573);


//Registrando os serviços
qpassa.registerService('/servico1',function(data,resp, item){
  resp('alguma coisa');
  qpassa.publish('/meuServico','teste');
});

qpassa.subscribe('/meuServico',function(data){
  console.log('Retornou ' + data);
})




