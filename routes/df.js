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
  function MOTIVOINDP(agent){
    let contextIn = agent.context.get('cslog')
    let Nome = contextIn.parameters.Nome  
    agent.add(`${Nome}`)
    let motivo = contextIn.parameters.motivo
    let tel    = contextIn.parameters.tel
    let id     = contextIn.parameters.IdContr
    agent.add(`Registrei seu motivo, agora podemos continuar`)
    return axios.get(`http://127.0.0.1:1880/acionar?id=${id}&tel=${tel}&climsg=MOTIVO DE ATRASO: ${motivo}`)
    .then((result) => {
      agent.add(`Diga cálculo para que eu te passe os valores em aberto`)
    })
    .catch (error => {
      agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
  })
 
  }
  function simular (agent) {
    let calc        = agent.context.get('cslog')
    let IdContr     = calc.parameters.IdContr
    let QtdeParcAtr = calc.parameters.QtdeParcAtr
    let vencperm    = calc.parameters.vencperm
   // var clienteptdate   = dateToPT(vencperm)
//    agent.add(`O protocolo e ID de seu contrato é ${IdContr}`);
    return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
      let valor = result.data.XML.Calculo[0].TotalSemDesc
      let titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`${titulos}`)  
      agent.add(`O valor em aberto está em R$${valor} (atualizado hoje)`)
      agent.add(`Me diga a forma de pagamento? (A vista ou Parcelado?)`)
      //agent.add(`Venc ${clienteptdate}`)
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
    agent.add(`já solicitei que reenviem o boleto no seu email:${email},agora é só aguardar`)
    agent.add(`dentro de 24 horas úteis é o prazo limite, não deixe de verificar todas as caixas de seu email.`)
console.log(idContr)
      return axios.get(`http://127.0.0.1:1880/reenvio?id=${id}&email=${email}`)
    .then((result) => {
      agent.add(`Abri a solicitação, agora é só aguardar`)
    });
  }

  function avista (agent) {
      const calc          = agent.context.get('cslog')
      const IdContr       = calc.parameters.IdContr
      const QtdeParcAtr   = calc.parameters.QtdeParcAtr
      let vencperm        = calc.parameters.vencperm
      let desconto        = calc.parameters.desconto
      var clienteptdate   = dateToPT(vencperm)
      return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=${desconto}`)
      .then((result) => {
        let descvista = result.data.XML.Calculo[0].Total
        agent.add(`Consegui a vista por:`);  
        agent.add(`R$${descvista}`); 
        agent.add(`Com vencimento para ${clienteptdate}`)
        agent.add(`Pode formalizar o acordo?`); 
        agent.context.set({
          'name':'condAC',
          'lifespan': 5,
          'parameters':{
            'desconto':desconto,
            'parcela':1
            }
        });
         })
         .catch (error => { //Em caso do webservice não liberar desconto, retorna o erro e abre outra solicitação como promisse
          return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
          .then((result) => {
            let calculo = result.data.XML.Calculo[0].Total
            agent.add(`Juro que tentei um desconto mas não foi autorizado`);  
            agent.add(`fica a vista por R$${calculo}`); 
            agent.add(`Com vencimento para ${clienteptdate}`);
            agent.add(`Vamos formalizar este acordo 😊?`)
            agent.context.set({
              'name':'condAC',
              'lifespan': 5,
              'parameters':{
                'desconto':0,
                'parcela':1
                }
            }); 
            
             })
              })
  }
  function check(int) {
    return int/10;
  }

  function dateToPT(date)
  {	
    return date.split('-').reverse().join('/');
  }
  ///events itents
  function negociarsim (agent) { 
    agent.add(`transferindo`)
    agent.setFollowupEvent('MOTIVOINDP'); //followup end
}
function aceitouparcelamento(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('inputemail'); //followup end
}
function emailconfirmado(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('gravarac'); //followup end
}
//end event itents
function acvistaform (agent) { 
  let contextIn   = agent.context.get('cslog')
  let IdContr     = contextIn.parameters.IdContr
  let QtdeParcAtr = contextIn.parameters.QtdeParcAtr  
  let vencperm    = contextIn.parameters.vencperm
  let contextIn2  = agent.context.get('condavista-sim-followup')
  let email       = contextIn2.parameters.email
  let x           = agent.context.get('condac')
  let gravacomdesc = x.parameters.desconto
  let parcela     = x.parameters.parcela

  return axios.get(`http://127.0.0.1:1880/gravadesc?id=${IdContr}&venc=${vencperm}&parc=${parcela}&qpo=${QtdeParcAtr}&email=${email}&desc=${gravacomdesc}`)
  .then((result) => {
    var valor = result.data.XML.Calculo[0].Total
    var email = result.data.XML.Boleto[0].EnvioPara[0]
    //var titulos = result.data.XML.Calculo[0].Detalhes pensar se coloco ou não
    agent.add(`Formalizei seu acordo no valor de R$${valor}, aguarde o boleto que em breve estará disponível em: ${email}`)
    agent.add(`Atenção evite problemas com o seu boleto, caso não ocorra o pagamento as condições formalizadas serão alteradas`)  
    agent.add(`O pagamento pode ser feito em agencias bancárias ou correspondentes, caso tenha dúvidas me pergunte que estou aqui para ajudar`)  

  })
     
     .catch (error => {
      agent.add(`Não consegui gravar o seu acordo, vou precisar que ligue para 1133057600`)
    });
}

function Parcelamento(agent) {
  const calc          = agent.context.get('cslog')
  const IdContr       = calc.parameters.IdContr
  const QtdeParcAtr   = calc.parameters.QtdeParcAtr
  let vencperm        = calc.parameters.vencperm
 // let desconto        = calc.parameters.desconto
  var clienteptdate   = dateToPT(vencperm)
  return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=3&qpo=${QtdeParcAtr}&desc=0`)
  .then((result) => {
    //let descvista = result.data.XML.Calculo[0].Total
    let Parcela1 = result.data.XML.Calculo[0].Parcelas[0].Parcela[0].Valor[0]
    let Parcela2 = result.data.XML.Calculo[0].Parcelas[0].Parcela[1].Valor[0]
    let Parcela3 = result.data.XML.Calculo[0].Parcelas[0].Parcela[2].Valor[0]
    agent.add(`Valor da primeira parcela:R$${Parcela1}`)  
    agent.add(`Valor da segunda parcela: R$${Parcela2}`)
    agent.add(`Valor da terceira parcela:R$${Parcela3}`)
    agent.add(`Com vencimento para ${clienteptdate}`);
    agent.add(`Aceita o acordo nestas condições? (Sim ou não? ??)`)
    agent.context.set({
      'name':'condAC',
      'lifespan': 5,
      'parameters':{
        'desconto':0,
        'parcela':3
        }
    });
     })
}

function gravarac (agent) { 
  let contextIn   = agent.context.get('cslog')
  let IdContr     = contextIn.parameters.IdContr
  let QtdeParcAtr = contextIn.parameters.QtdeParcAtr  
  let vencperm    = contextIn.parameters.vencperm
  //let contextIn2  = agent.context.get('condavista-sim-followup')
  //let email       = contextIn2.parameters.email
  let x           = agent.context.get('condac')
  let gravacomdesc = x.parameters.desconto
  let parcela     = x.parameters.parcela

  return axios.get(`http://127.0.0.1:1880/gravadesc?id=${IdContr}&venc=${vencperm}&parc=${parcela}&qpo=${QtdeParcAtr}&email=${email}&desc=${gravacomdesc}`)
  .then((result) => {
    var valor = result.data.XML.Calculo[0].Total
    var email = result.data.XML.Boleto[0].EnvioPara[0]
    //var titulos = result.data.XML.Calculo[0].Detalhes pensar se coloco ou não
    agent.add(`Formalizei seu acordo no valor de R$${valor}, aguarde o boleto que em breve estará disponível em: ${email}`)
    agent.add(`Atenção evite problemas com o seu boleto, caso não ocorra o pagamento as condições formalizadas serão alteradas`)  
    agent.add(`O pagamento pode ser feito em agencias bancárias ou correspondentes, caso tenha dúvidas me pergunte que estou aqui para ajudar`)  

  })
     
     .catch (error => {
      agent.add(`Não consegui gravar o seu acordo, vou precisar que ligue para 1133057600`)
    });
}


  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);
  intentMap.set('reenvioboleto', reenvioboleto);
  intentMap.set('simular', simular);
  intentMap.set('condavista', avista);
  intentMap.set('negociar-yes', negociarsim);
  intentMap.set('MOTIVOINDP', MOTIVOINDP);  
  intentMap.set('acordoavistaformalizado', acvistaform);  
  intentMap.set('condparcelada', Parcelamento);  
  intentMap.set('gravarac', gravarac);  
  intentMap.set('condparcelada-sim', aceitouparcelamento);  
  intentMap.set('emailconfirmado', emailconfirmado);  
  agent.handleRequest(intentMap)
})
app.listen(process.env.PORT || 8080)