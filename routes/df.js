'use strict';
const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const axios = require('axios');
app.get('/', (req, res) => res.send('online e funcionando'))
app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function buscarcpf () {
    const cpf = agent.parameters.cpf;
    return axios.get(`http://127.0.0.1:1880/teste?cpf=${cpf}`)
    .then((result) => {
      let IdContr     = result.data.XML.Contratos[0].Contrato[0].IdContr[0]
      let Nome        = result.data.XML.Contratos[0].Contrato[0].Nome[0]
      let NomeEmpresa = result.data.XML.Contratos[0].Contrato[0].NomeEmpresa[0]
      let MaxParc     = result.data.XML.Contratos[0].Contrato[0].MaxParcelamento[0]
      let Parcel      = result.data.XML.Contratos[0].Contrato[0].Parcelamentos[0]
      let Status      = result.data.XML.Contratos[0].Contrato[0].Status[0]
      let QtdeParcAtr = result.data.XML.Contratos[0].Contrato[0].QtdeParcAtraso[0]
      let vencdisp    = result.data.XML.Contratos[0].Contrato[0].Vencimentos[0]
      let NumContr    = result.data.XML.Contratos[0].Contrato[0].NumContrato[0]
      let PercDescTab = result.data.XML.Contratos[0].Contrato[0].PercDescTab
      agent.add(`Consultei o CPF:${cpf}`);
      agent.add(`Falo com: ${Nome}?`)
      agent.add(`Referente a ${NomeEmpresa}`)
      agent.add(`Seu contrato está em ${Status}`)
      agent.add(`Se for você, diga sim para continuar`)
      agent.context.set({
        'name':'cslog',
        'lifespan': 8,
        'parameters':{
          'IdContr':IdContr,
          'Nome':Nome,
          'NomeEmpresa':NomeEmpresa,
          'MaxParc':MaxParc,
          'Parcel':Parcel,
          'Status':Status,
          'QtdeParcAtr':QtdeParcAtr,
          'vencdisp':vencdisp,
          'NumContr':NumContr,
          'PercDescTab':PercDescTab
          }
      });
      })
  }  
  
  
  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);

  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)