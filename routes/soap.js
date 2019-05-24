// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser')
// app.use( bodyParser.json() );
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
// app.post('/bot', function(request, response) {
//
//     const intentName = request.body.queryResult.intent.displayName;
//
//     if ('incluir.contatos' === intentName) {
//         console.log('incluir')
//
//         var cpf_contato         = request.body.queryResult.parameters['cpf-contato'];
//
//         var query = 'insert into contatos values ("'+cpf_contato+'","'+nome_contato+'","'+email_contato+'","'+telefone_contato+'","'+endereco_contato+'","'+endernum_contato+'","'+endercompl_contato+'","'+total_contato+'","'+valorav_contato+'","'+valorpc_contato+'","'+atraso_contato+'")';
//
//         response.json({"fulfillmentText" :"Contrato Inserido com Sucesso na base MYSQL" })
//
//     } else if (intentName == '') {
//         console.log('apagar')
//
//         var numero_contato = request.body.queryResult.parameters['numero-contato'];
//         var query = 'delete from contatos where telefone = "'+numero_contato+'"';
//
//         connection.query(query, function (error, results, fields) {
//             if (error) throw error;
//             connection.end();
//             response.json({"fulfillmentText" :"Contato Apagado com Sucesso" })
//         });
//
//     } else if (intentName == 'cep.buscar') {
//         console.log('pesquisar')
//         var user  = request.body.queryResult.parameters['cep'];
//         const soap = require('strong-soap').soap;
//         const url = 'https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl';
//         const requestArgs = {
//             cep: user
//         };
//         const options = {};
//         soap.createClient(url, options, function(err, client) {
//             const method = client['consultaCEP'];
//             method(requestArgs, function(err, result ) {
//                 console.log(result)
//                 //const teste = (JSON.stringify(result));
//                 c = result
//                 response.json({"fulfillmentText" : c.return.end +' 👉Bairro:'+c.return.bairro+ '👉Cidade:\n'+c.return.cidade+ '🏢UF:\n'+c.return.uf})
//
//             });
//
//
//
//         });
//         var results =  '';
//
//     }
//
// });
//
// // listen for requests :)
// const listener = app.listen(process.env.PORT, function() {
//     console.log('Your app is listening on port ' + listener.address().port);
// });
//
//
// function correios()
// const soap = require('strong-soap').soap;
// const url = 'https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl';
// const requestArgs = {
//     cep: user
// };
// const options = {};
// soap.createClient(url, options, function(err, client) {
//     const method = client['consultaCEP'];
//     method(requestArgs, function(err, result ) {
//         console.log(result)
//         //const teste = (JSON.stringify(result));
// return result

'use strict';

// Include nodejs request-promise-native package as dependency
// because async API calls require the use of Promises
const rpn = require('request-promise-native');
const hostAPI = 'https://my.api.here/'; // root URL of the API
const {WebhookClient} = require('dialogflow-fulfillment');

exports.googleCloudSearch = (req, res) => {
    const agent = new WebhookClient({request: req, response: res}); // Dialogflow agent
    console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers)); // testing
    console.log('Dialogflow Request body: ' + JSON.stringify(req.body)); // testing

    // Default welcome intent
    function welcome(agent) {
        agent.add('Welcome to my chatbot!');
    }

    // Default fallback intent
    function fallback(agent) {
        agent.add('Sorry, I don\'t understand.');
    }

    // Default conversation end
    function endConversation(agent) {
        agent.add('Thank you and have a nice day!');
    }

    // Function for passing data to the myapi.search intent in Dialogflow
    function searchMyApi(agent) {
        return new Promise((resolve, reject) => {
            // get parameters given by user in Dialogflow
            const param1 = agent.parameters.param1;
            const param2 = agent.parameters.param2;
            // and so on...

            console.log(`Parameters from Dialogflow: ${param1}, ${param2}`); // testing

            // If necessary, format the parameters passed by Dialogflow to fit the API query string.
            // Then construct the URL used to query the API.

            var myUrl = `${hostAPI}?parameter_1=${param1}&parameter_2=${param2}`;
            console.log('The URL is ' + myUrl); // testing

            // Make the HTTP request with request-promise-native
            // https://www.npmjs.com/package/request-promise

            var options = {
                uri: myUrl,
                headers: {
                    'User-Agent': 'Request-Promise-Native'
                },
                json: true
            };

            // All handling of returned JSON data goes under .then and before .catch
            rpn(options)
                .then((json) => {

                    var result = ''; // the answer passed to Dialogflow goes here

                    // Make a string out of the returned JSON object
                    var myStringData = JSON.stringify(json);
                    console.log(`This data was returned: ${myStringData}`); // testing

                    // Make an array out of the stringified JSON
                    var myArray = JSON.parse(myStringData);
                    console.log(`This is my array: ${myArray}`); // testing

                    // Code for parsing myArray goes here, for example:

                    if (condition) {
                        // For example, the returned JSON does not contain the data the user wants
                        result = agent.add('Sorry, could not find any results.');
                        resolve(result); // Promise resolved
                    }
                    else {
                        // If the desired data is found:
                        var output = ''; // put the data here
                        result = agent.add(`Here are the results of your search: ${output}`);
                        resolve(result); // Promise resolved
                    }
                }) // .then end
                .catch(() => { // if .then fails
                    console.log('Promise rejected');
                    let rejectMessage= agent.add('Sorry, an error occurred.');
                    reject(rejectMessage); // Promise rejected
                });	// .catch end
        }); // Promise end
    } // searchMyApi end

    // Mapping functions to Dialogflow intents
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('End Conversation', endConversation);
    intentMap.set('myapi.search', searchMyApi);
    agent.handleRequest(intentMap);

}; // exports end