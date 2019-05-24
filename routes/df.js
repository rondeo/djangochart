'use strict';
const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const axios = require('axios');
app.get('/', (req, res) => res.send('online e funcionando'))
app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function buscarcpf (agent) {
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
      let Carteira    = result.data.XML.Contratos[0].Contrato[0].NomeCarteira[0]
      if(Status == 'Acordo'){
        agent.add(`Você já tem um acordo vigente`);
        agent.add(`Recebeu o boleto? Caso não é só me dizer`);
        agent.add(`Tem alguma dúvida? ligue 1133057600 `);

      } else if (Status == 'Devolvido') { 
        agent.add(`Seu contrato não está mais conosco, procure a empresa credora`); 
      } 
        else if (Status == 'Cobrança') { 
      agent.add(`Consultei o CPF:${cpf}`);
      agent.add(`Existe um contrato com a ${Carteira}`)
      agent.add(`Em nome de ${Nome}`)
      agent.add(`Confirma?`)
      }
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
  
  function confirmadados(agent){
    let contextIn = agent.context.get('cslog')
    let Nome = contextIn.parameters.Nome  
    agent.add(`${Nome}`)
    let motivo = contextIn.parameters.motivo
    let tel    = contextIn.parameters.tel
    let id     = contextIn.parameters.IdContr
    agent.add(`Registrei seu motivo`)
    return axios.get(`http://127.0.0.1:1880/acionar?id=${id}&tel=${tel}&climsg=virtual:${motivo}`)
    .then((result) => {
      agent.add(`Diga cálculo para que eu te passe os valores em aberto`)
    });
  }
  function simular () {
    let calc = agent.context.get('cslog')
    let IdContr = calc.parameters.IdContr
    let QtdeParcAtr = calc.parameters.QtdeParcAtr
    agent.add(`O protocolo e ID de seu contrato é:${IdContr}`);
    /* data de hoje */
    let time = new Date();
    let outraData = new Date();
    outraData.setDate(time.getDate() + 4);
    let diadehoje = outraData.toISOString().slice(0,10);
    /* data de hoje */
    return axios.get(`http://127.0.0.1:1880/id?id=${IdContr}&vcto=${diadehoje}&parc=1&qdo=${QtdeParcAtr}`)
    .then((result) => {
      let valor = result.data.XML.Calculo[0].TotalSemDesc
      let titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`${titulos}`)  
      agent.add(`Totaliza hoje o valor de: R$${valor}`)
      agent.add(`Me diga a forma de pagamento? (A vista ou Parcelado?)`)
       });
   }

   function reenvioboleto(agent){
    let contextIn  = agent.context.get('email')
    let email      = contextIn.parameters.email 
    let context2In = context2In.agent.context.get('cslog')
/*     let Id         = contextIn.parameters.IdContr  
 */
 
    agent.add(`${Nome}`)
      return axios.get(`http://127.0.0.1:1880/reenvio?id=${id}&email=${email}`)
    .then((result) => {
      agent.add(`Abri a solicitação, agora é só aguardar`)
    });
  }

  function formadepgto (agent) {
    let formadepgto = agent.parameters.formadepgto;
    if (formadepgto == 'avista') {
      let calc          = agent.context.get('cslog')
      let IdContr       = calc.parameters.IdContr
      let QtdeParcAtr   = calc.parameters.QtdeParcAtr
      let PercDescTab   = calc.parameters.PercDescTab
      let int           = parseInt(PercDescTab);
      let desconto      = int/12
      var datetime      = new Date();
      datetime.setDate(time.getDate() + 4);
      let diadehoje     = datetime.toISOString().slice(0,10);
      return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${diadehoje}&parc=1&qdo=${QtdeParcAtr}&desc=${desconto}`)
      .then((result) => {
        let descvista = result.data.XML.Calculo[0].Total
        agent.add(`Consegui a vista por:`);  
        agent.add(`R$${descvista}`); 
        agent.add(`Pode formalizar o acordo?`);  
         }); 
         
    } else if (formadepgto == 'Parcelado') {
      let calc = agent.context.get('cslog')
      let IdContr = calc.parameters.IdContr
      let QtdeParcAtr = calc.parameters.QtdeParcAtr
      agent.add(`Simulei as condições parceladas`);
      /* data de hoje */
      var time = new Date();
      var outraData = new Date();
      outraData.setDate(time.getDate() + 4);
      let diadehoje = outraData.toISOString().slice(0,10);
      /* data de hoje */
      return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${diadehoje}&parc=3&qdo=${QtdeParcAtr}&desc=0`)
      .then((result) => {
        //let valor   = result.data.XML.Calculo[0].TotalSemDesc
        let Parcela1 = result.data.XML.Calculo[0].Parcelas[0].Parcela[0].Valor[0]
        let Parcela2 = result.data.XML.Calculo[0].Parcelas[0].Parcela[1].Valor[0]
        let Parcela3 = result.data.XML.Calculo[0].Parcelas[0].Parcela[2].Valor[0]
        agent.add(`Valor da primeira parcela: ${Parcela1}`)  
        agent.add(`Valor da segunda parcela: R$${Parcela2}`)
        agent.add(`Valor da terceira parcela: R$${Parcela3}`)
        agent.add(`Aceita o acordo nestas condições? (Sim ou não? 😊)`)
         });
    } else {
      agent.add(`Forma de pagamento indisponível`);
    }
  }

  function gravaracordo () {
    let contextIn      = agent.context.get('cslog')
    let IdContr        = contextIn.parameters.IdContr
    let QtdeParcAtr    = contextIn.parameters.QtdeParcAtr  
    let grava          = agent.context.get('gravaracordo')
    let email          = grava.parameters.email
    /* data de hoje */
    var time = new Date();
    var outraData = new Date();
    outraData.setDate(time.getDate() + 4);
    let diadehoje = outraData.toISOString().slice(0,10);
    /* data de hoje */
    return axios.get(`http://127.0.0.1:1880/grava?id=${IdContr}&venc=${diadehoje}&selcparc=1&pcatr=${QtdeParcAtr}&email=${email}`)
    .then((result) => {
      var valor = result.data.XML.Calculo[0].TotalSemDesc
      var titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`Seu acordo foi formalizado, conte com a magno assessoria`)
       });
  }
  
  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);
  intentMap.set('confirmadados', confirmadados);
  intentMap.set('reenvioboleto', reenvioboleto);
  intentMap.set('simular', simular);
  intentMap.set('formadepgto', formadepgto);
  intentMap.set('gravaracordo', gravaracordo);

  


  //intentMap.set('simular', simular);


  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)