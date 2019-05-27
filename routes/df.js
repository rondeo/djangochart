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
    let pattern = /(^\d{3}\.\d{3}\.\d{3}\-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$)/;
    if (cpf.length !== 11) {
      agent.add(`CPF precisa ter 11 digitos, diga negociar novamente para consulta`);
    } else if (cpf.match(pattern) !== null) {
      agent.add(`CPF inválido`);
    } else {

    return axios.get(`http://127.0.0.1:1880/teste?cpf=${cpf}`)
    .then((result) => {
      let IdContr     = result.data.XML.Contratos[0].Contrato[0].IdContr
      let Nome        = result.data.XML.Contratos[0].Contrato[0].Nome
      let NomeEmpresa = result.data.XML.Contratos[0].Contrato[0].NomeEmpresa
      let MaxParc     = result.data.XML.Contratos[0].Contrato[0].MaxParcelamento
      let Parcel      = result.data.XML.Contratos[0].Contrato[0].Parcelamentos
      let Status      = result.data.XML.Contratos[0].Contrato[0].Status
      let QtdeParcAtr = result.data.XML.Contratos[0].Contrato[0].QtdeParcAtraso
      let vencdisp    = result.data.XML.Contratos[0].Contrato[0].Vencimentos
      let NumContr    = result.data.XML.Contratos[0].Contrato[0].NumContrato
      let PercDescTab = result.data.XML.Contratos[0].Contrato[0].PercDescTab
      var Carteira    = result.data.XML.Contratos[0].Contrato[0].NomeCarteira      
      if(Status == 'Acordo'){
        agent.add(`Você já tem um acordo vigente`);
        agent.add(`Recebeu o boleto? Caso não é só dizer "não recebi o boleto"`);
        agent.add(`Tem alguma outra dúvida? ligue ☎1133057600`);
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
          'PercDescTab':PercDescTab,
          'Carteira':Carteira
          }
      });
      })
      .catch (error => {
        agent.add(`Não consegui encontrar o seu CPF. Pode ter acontecido o seguinte:`);
        agent.add(`➡Seu CPF não está em nossa base`); 
        agent.add(`➡Caso indisponivel para negociar neste canal`); 
        agent.add(`Caso queira tentar novamente é só dizer negociar`); 
    })
    }
  }  
  function confirmadados(agent){
    let contextIn = agent.context.get('cslog')
    let Nome = contextIn.parameters.Nome  
    agent.add(`${Nome}`)
    let motivo = contextIn.parameters.motivo
    let tel    = contextIn.parameters.tel
    let id     = contextIn.parameters.IdContr
    agent.add(`Registrei seu motivo, agora podemos continuar`)
    return axios.get(`http://127.0.0.1:1880/acionar?id=${id}&tel=${tel}&climsg=virtual:${motivo}`)
    .then((result) => {
      agent.add(`Diga cálculo para que eu te passe os valores em aberto`)
    })
    
    .catch (error => {
      agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
  })
    
  }
  function simular () {
    let calc = agent.context.get('cslog')
    let IdContr = calc.parameters.IdContr
    let QtdeParcAtr = calc.parameters.QtdeParcAtr
    agent.add(`O protocolo e ID de seu contrato é:${IdContr}`);
    let calcvenc = diadocalculo() 
    return axios.get(`http://127.0.0.1:1880/id?id=${IdContr}&vcto=${calcvenc}&parc=1&qdo=${QtdeParcAtr}`)
    .then((result) => {
      let valor = result.data.XML.Calculo[0].TotalSemDesc
      let titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`${titulos}`)  
      agent.add(`Totaliza hoje o valor de: R$${valor}`)
      agent.add(`Me diga a forma de pagamento? (A vista ou Parcelado?)`)
       })
       .catch (error => {
        agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
    })
   }
   function reenvioboleto(agent){
    let contextIn  = agent.context.get('email')
    let email      = contextIn.parameters.email 
    let context2In = context2In.agent.context.get('cslog')
    let id         = context2In.parameters.IdContr  
    agent.add(`Processando solicitação de reenvio para o contrato:${id} para ser encaminhado no e email ${email}, é só aguardar`)
      return axios.get(`http://127.0.0.1:1880/reenvio?id=${id}&email=${email}`)
    .then((result) => {
      agent.add(`Abri a solicitação, agora é só aguardar`)
    });
  }
  //int
  function avista (agent) {
      const calc          = agent.context.get('cslog')
      const IdContr       = calc.parameters.IdContr
      const QtdeParcAtr   = calc.parameters.QtdeParcAtr
      const PercDescTab   = calc.parameters.PercDescTab
      let int      = parseInt(PercDescTab);
      let desconto = check(int) 
      let calcvenc = diadocalculo() 
      return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${calcvenc}&parc=1&qdo=${QtdeParcAtr}&desc=${desconto}`)
      .then((result) => {
        let descvista = result.data.XML.Calculo[0].Total
        agent.add(`Consegui a vista por:`);  
        agent.add(`R$${descvista}`); 
        agent.add(`Pode formalizar o acordo?`); 
        // agent.context.set({
        //   'name':'avista',
        //   'lifespan': 1,
        //   'parameters':{
        //     'forma de pgto':"A vista",
        //     'valor':descvista,
        //     'venc':calcvenc
        //     }
        // }); 
         })
         .catch (error => {
          agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
      })
  }
  //end
   //int parcelado
   function Parcelamento (agent) {
    let calc = agent.context.get('cslog')
    let IdContr = calc.parameters.IdContr
    let QtdeParcAtr = calc.parameters.QtdeParcAtr
    let calcvenc = diadocalculo() 
    console.log(calcvenc)
    agent.add(`Simulei as condições parceladas`);
    return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${calcvenc}&parc=3&qdo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
      let Parcela1 = result.data.XML.Calculo[0].Parcelas[0].Parcela[0].Valor[0]
      let Parcela2 = result.data.XML.Calculo[0].Parcelas[0].Parcela[1].Valor[0]
      let Parcela3 = result.data.XML.Calculo[0].Parcelas[0].Parcela[2].Valor[0]
      agent.add(`Valor da primeira parcela: ${Parcela1}`)  
      agent.add(`Valor da segunda parcela: R$${Parcela2}`)
      agent.add(`Valor da terceira parcela: R$${Parcela3}`)
      agent.add(`Aceita o acordo nestas condições? (Sim ou não? 😊)`)
       })
       .catch (error => {
        agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
    })
}
//end parcelado

  function gravaracordo () {
    let contextIn      = agent.context.get('cslog')
    let IdContr        = contextIn.parameters.IdContr
    let QtdeParcAtr    = contextIn.parameters.QtdeParcAtr  
    let grava          = agent.context.get('gravaracordo')
    let email          = grava.parameters.email
    let calcvenc       = diadocalculo() 
    return axios.get(`http://127.0.0.1:1880/grava?id=${IdContr}&venc=${calcvenc}&selcparc=1&pcatr=${QtdeParcAtr}&email=${email}`)
    .then((result) => {
      var valor = result.data.XML.Calculo[0].TotalSemDesc
      var titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`Seu acordo foi formalizado, conte com a magno assessoria`)
       })
       .catch (error => {
        agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
    })
  }

  function check(int) {
    return int/10;
  }
  function diadocalculo()
  {
        var time = new Date();
        var outraData = new Date();
        outraData.setDate(time.getDate() + 4);
        let diadehoje = outraData.toISOString().slice(0,10);
        return diadehoje;
  }
  
  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);
  intentMap.set('confirmadados', confirmadados);
  intentMap.set('reenvioboleto', reenvioboleto);
  intentMap.set('simular', simular);
  intentMap.set('gravaracordo', gravaracordo);
  intentMap.set('condavista', avista);
  intentMap.set('condparcelada', Parcelamento);
  agent.handleRequest(intentMap)
})
app.listen(process.env.PORT || 8080)