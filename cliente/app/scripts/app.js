'use strict';

/**
 * @ngdoc overview
 * @name cliqpApp
 * @description
 * # cliqpApp
 *
 * Main module of the application.
 */
angular
  .module('cliqpApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'bd.sockjs'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/default', {
        templateUrl: 'views/default.html',
        controller: 'DefaultCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }).service('qpassa', function (socketFactory, $timeout, $rootScope) {
      var sockjs = new SockJS('http://localhost:573/ws');
      var item = {};
      item.state = 'CLOSED';
      var dataCallback = {};
      var serviceCallback = {};

      var qps = socketFactory({
        socket: sockjs
      });

      qps.setHandler('open',function(data){
        $rootScope.$broadcast('qpassaconnected', []);
        item.state = 'OPENED';
      });


      item.publish = function(serviceName,data){
         var msg = {
          type: 'PUB',
          service : serviceName,
          data: data
        };
        qps.send(JSON.stringify(msg));
      }

      item.register = function(serviceName, callback){
        var msg = {
          type: 'SUB',
          service: serviceName,
          data: ''
        };

        //Enviando o publish
        qps.send(JSON.stringify(msg));
        //configurando o callback
        if (dataCallback[msg.service] == undefined){
          dataCallback[msg.service] = [];
        }
        dataCallback[msg.service].push(callback);
      };

      item.unregister = function(serviceName, callback){
        var msg = {
          type: 'UNSUB',
          service : serviceName,
          data: ''
        };

        //Enviando o publish
        qps.send(JSON.stringify(msg));
      };


      item.get = function(serviceName,data,callback){
        var msg = {
          type: 'GET',
          service : serviceName,
          data: data
        };

        //Enviando o publish        
        serviceCallback[msg.service] = callback;
        qps.send(JSON.stringify(msg));


      }


       item.list = function(callback){
        var msg = {
          type: 'GET',
          service : '/list',
          data: ''
        };

        //Enviando o publish        
        serviceCallback[msg.service] = callback;
        qps.send(JSON.stringify(msg));

      }

      qps.setHandler('message',function(data){
        if (data != undefined){
          var it = JSON.parse(data.data);
          if (it['error'] != undefined){
            alert(it.error);
          }else{
            var service = it.service;
            if (it.type == 'GET'){
                var fn = serviceCallback[it.service];
                if (fn != undefined){
                  fn(it.data,it);
                  delete serviceCallback[it.service];
                }
            }else{
              var itens = dataCallback[it.service];
              if (itens != undefined && itens.length > 0){
                itens.forEach(function(el){
                   el(it.data,it);
                });
              }                          
            }


          }

        }
      });



      return item;
});
