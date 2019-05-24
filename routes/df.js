'use strict';
const express = require('express');
const axios = require('axios');
const soap = require('strong-soap');


const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()

app.get('/', (req, res) => res.send('online'))
app.post('/dialogflow', express.json(), (req, res) => {
    const agent = new WebhookClient({ request: req, response: res })



    function dialogflowHandlerWithAxios(agent) {
        return callApi('https://jsonplaceholder.typicode.com/todos/1').then(response => {
            console.log(response.data.title)
            agent.add(response.data.title);
        }).catch (error => {
            agent.add('Houve um erro no processamento da sua solicitação');
        })
    }

    function cep (agent) {
        return soapreturn
            .then(res => {
                console.log(res)
            }).catch(err => {
                console.log(err.response.data)
            })
        //agent.add('Welcome to my agent!')

    }

    function callApi(url) {
        return axios.get(url);
    }

    function soapreturn(){
        return axios.post('https://wscredhomosocinalparceria.facilinformatica.com.br/WCF/Soap/Emprestimo.svc?wsdl',
            xmls,
            {headers:
                    {
                        'Content-Type': 'text/xml',
                        SOAPAction: 'http://schemas.facilinformatica.com.br/Facil.Credito.WsCred/IEmprestimo/CalcularPrevisaoDeParcelas'}
            })
    }


    let intentMap = new Map()
    intentMap.set('cep', cep);
    intentMap.set('apichama', dialogflowHandlerWithAxios)

    agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)