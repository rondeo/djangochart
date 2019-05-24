// "use strict";
// var soap = require('strong-soap').soap;
// var url = 'http://ws.cdyne.com/ip2geo/ip2geo.asmx?wsdl';
// var requestArgs = {
//     "ipAddress": "8.8.8.8",
//     "licenseKey": ""};
// var options = {};
// soap.createClient(url, options, function(err, client) {
//     var method = client['ResolveIP'];
//     method(requestArgs, function(err, result, soapHeader) {
//         //response envelope
//         // console.log('Response Envelope: \n' + envelope);
//         //'result' is the response body
//         //console.log(result)
//         console.log('Result: \n' + JSON.stringify(result));
//     });
// });

function dialogflowHandlerWithAxios(agent) {
    return callApi('https://jsonplaceholder.typicode.com/todos/1').then(response => {
        agent.add('My response');
    }).catch (error => {
        // do something
    })
};

function callApi(url) {
    return axios.get(url);
}
