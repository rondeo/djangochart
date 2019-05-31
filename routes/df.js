'use strict';
const x = require('./credor.js')
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

    return axios.get(`http://127.0.0.1:1880/buscarcpf?cpf=${cpf}`)
    .then((result) => {
      let IdContr     = result.data.XML.Contratos[0].Contrato[0].IdContr
      let Nome        = result.data.XML.Contratos[0].Contrato[0].Nome
      let MaxParc     = result.data.XML.Contratos[0].Contrato[0].MaxParcelamento
      let Parcel      = result.data.XML.Contratos[0].Contrato[0].Parcelamentos
      let Status      = result.data.XML.Contratos[0].Contrato[0].Status
      let QtdeParcAtr = result.data.XML.Contratos[0].Contrato[0].QtdeParcAtraso
      let vencdisp    = result.data.XML.Contratos[0].Contrato[0].Vencimentos[0]
      let NumContr    = result.data.XML.Contratos[0].Contrato[0].NumContrato
      let PercDescTab = result.data.XML.Contratos[0].Contrato[0].PercDescTab[0]
      var Carteira    = result.data.XML.Contratos[0].Contrato[0].NomeCarteira
      let vencperm    = vencdisp.slice(11,21)      
      if(Status == 'Acordo'){
        agent.add(`Você já tem um acordo vigente`);
        agent.add(`Recebeu o boleto? Caso não é só dizer "não recebi o boleto"`);
        agent.add(`Tem alguma outra dúvida? ligue ☎1133057600`);
      } else if (Status == 'Devolvido') { 
        agent.add(`Poxa !! Vi que retiram seu contrato daqui, vou pedir que procure a empresa credora`); 
      } 
        else if (Status == 'Cobrança') { 
      agent.add(`Consultei o CPF:${cpf}`);
      var credorform = x.credor(Carteira)
      agent.add(`Existe um contrato com a ${credorform}`)
      agent.add(`Em nome de ${Nome}`)
      agent.add(`Confirma?`)
      }
      agent.context.set({
        'name':'cslog',
        'lifespan': 10,
        'parameters':{
          'IdContr':IdContr,
          'Nome':Nome,
          'MaxParc':MaxParc,
          'Parcel':Parcel,
          'Status':Status,
          'QtdeParcAtr':QtdeParcAtr,
          'vencdisp':vencdisp,
          'vencperm':vencperm,
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
    let calc        = agent.context.get('cslog')
    let Nome        = calc.parameters.Nome  
    let IdContr     = calc.parameters.IdContr
    let QtdeParcAtr = calc.parameters.QtdeParcAtr
    let vencperm    = calc.parameters.vencperm
    agent.add(`${Nome}`)
    let motivo = calc.parameters.motivo
    let tel    = calc.parameters.tel
    let id     = calc.parameters.IdContr
    agent.add(`Registrei o motivo e já busquei o que consta em aberto.`)
    return axios.get(`http://127.0.0.1:1880/acionar?id=${id}&tel=${tel}&climsg=MOTIVO DE ATRASO: ${motivo}`)
    .then((result) => {
            return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
            .then((result) => {
              let valor = result.data.XML.Calculo[0].TotalSemDesc
              let titulos = result.data.XML.Calculo[0].Detalhes
              agent.add(`${titulos}`)  
              agent.add(`O valor está hoje em R$${valor} (atualizado)`)
              agent.add(`Preciso saber a forma de pagamento? (A vista ou Parcelado?)`)
               })
    })
    .catch (error => {
      agent.add(`Ops, seu contrato foi bloqueado, vou pedir que ligue urgente para o tel: 1133057600`)
  })
 
  }
  
   function reenvioboleto(agent){
    const cpf = agent.parameters.cpf;
    const email = agent.parameters.email;
    return axios.get(`http://127.0.0.1:1880/buscarcpf?cpf=${cpf}`)
    .then((result) => {  
      let IdContr  = result.data.XML.Contratos[0].Contrato[0].IdContr
      axios.get(`http://127.0.0.1:1880/email?id=${IdContr}&email=${email}`)
      return axios.get(`http://127.0.0.1:1880/reenvio?id=${IdContr}&email=${email}`)
    .then((result) => {
     let status = result.data.XML.Retorno[0].Status
     if(status == 'ERRO'){
      agent.add(`Não consegui solicitar o reenvio para o seu contrato, vou pedir que ligue no 1133057600`) 
     } else {
      agent.add(`já solicitei que reenviem o boleto no seu email:${email},agora é só aguardar`)
      agent.add(`dentro de 24 horas úteis é o prazo limite, não deixe de verificar todas as caixas de seu email.`)
     }
    });
  })
  .catch (error => {
    agent.add(`Ops,não consegui reenviar o seu boleto, favor ligar no tel: 1133057600`)
})
  }

  function avista (agent) {
      const calc          = agent.context.get('cslog')
      const IdContr       = calc.parameters.IdContr
      const QtdeParcAtr   = calc.parameters.QtdeParcAtr
      let vencperm        = calc.parameters.vencperm
      let PercDescTab     = calc.parameters.PercDescTab
      let desconto        = check(PercDescTab)
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
          'lifespan': 8,
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
  let desconto = parseInt(int)
    return desconto/10;
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
function aceitouavista(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('inputemail'); //followup end
}
function emailconfirmado(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('gravarac'); //followup end
}
//end event itents

function Parcelamento(agent) {
  const calc          = agent.context.get('cslog')
  const IdContr       = calc.parameters.IdContr
  const QtdeParcAtr   = calc.parameters.QtdeParcAtr
  let vencperm        = calc.parameters.vencperm
  var clienteptdate   = dateToPT(vencperm)
  return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=3&qpo=${QtdeParcAtr}&desc=0`)
  .then((result) => {
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
     .catch (error => {
      agent.add(`Infelizmente não consegui parcelar o seu contrato. Diga a vista para seguirmos com a negociação`)
    });
}

function gravarac (agent) { 
    let contextIn   = agent.context.get('cslog')
    let IdContr     = contextIn.parameters.IdContr
    let QtdeParcAtr = contextIn.parameters.QtdeParcAtr  
    let vencperm    = contextIn.parameters.vencperm
    let email       = contextIn.parameters.email
    let x           = agent.context.get('condac')
    let gravacomdesc = x.parameters.desconto
    let parcela     = x.parameters.parcela
  
    return axios.get(`http://127.0.0.1:1880/gravadesc?id=${IdContr}&venc=${vencperm}&parc=${parcela}&qpo=${QtdeParcAtr}&email=${email}&desc=${gravacomdesc}`)
    .then((result) => {
      var venc  = result.data.XML.Boleto[0].Vencimento[0]
      var email           = result.data.XML.Boleto[0].EnvioPara[0]
      var clienteptdate   = dateToPT(venc)
      agent.add(`Formalizei seu acordo, aguarde que em breve o boleto estará disponível em: ${email}`)
      agent.add(`⚠Atenção, caso não ocorra o pagamento até o vencimento ${clienteptdate} as condições aqui formalizadas serão perdidas⚠`)  
      agent.add(`Dúvidas? me ligue ☎️1133057600`)    
  })
     
     .catch (error => {
      agent.add(`Não consegui gravar o seu acordo, vou precisar que ligue para 1133057600`)
    });
}


  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);
  intentMap.set('reenvioboleto', reenvioboleto);
  intentMap.set('condavista', avista);
  intentMap.set('negociar-yes', negociarsim);
  intentMap.set('MOTIVOINDP', MOTIVOINDP);  
  intentMap.set('acordoavistaformalizado', aceitouavista);  
  intentMap.set('condparcelada', Parcelamento);  
  intentMap.set('gravarac', gravarac);  
  intentMap.set('condparcelada-sim', aceitouparcelamento);  
  intentMap.set('emailconfirmado', emailconfirmado);  
  agent.handleRequest(intentMap)
})
app.listen(process.env.PORT || 8080)