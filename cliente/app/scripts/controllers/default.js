'use strict';

/**
 * @ngdoc function
 * @name cliqpApp.controller:DefaultCtrl
 * @description
 * # DefaultCtrl
 * Controller of the cliqpApp
 */
angular.module('cliqpApp')
  .controller('DefaultCtrl', function ($scope, qpassa, $timeout) {

  	/*var msg = {type: 'SUB',service: '/teste',data: 'dados'};
	var msgPub = {type: 'PUB',service: '/teste',data: 'publicado'};


	mysock.setHandler('open',function(data){
		mysock.send(JSON.stringify(msg));
		$timeout(function(){
			mysock.send(JSON.stringify(msgPub));
		},2000);		
	});

	mysock.setHandler('message',function(data){
		console.log(data);
		$scope.message = data;
	});*/

  	$scope.$on('qpassaconnected',function(){
	  	qpassa.register('/teste',function(dados){
	  		$scope.message = dados;
	  	});
  	});

  	$scope.envia = function(){
  		qpassa.get('/servico1',$scope.texto, function(data){
  			$scope.message = data;
  		});  	

  		qpassa.list(function(data){
  			$scope.message2 = data;
  		});


  		qpassa.register('/meuServico',function(data){
  			$scope.message3 = data;
  		});

  	}


  });
