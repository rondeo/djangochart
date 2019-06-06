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
      let Carteira    = result.data.XML.Contratos[0].Contrato[0].NomeCarteira
      let telsmagno   = result.data.XML.Contratos[0].Contrato[0].TelRetorno
      let maiscontr   = result.data.XML
      let vencperm    = vencdisp.slice(11,21) 
      let adddias     = addDays(vencperm, 6);
      let credorform  = x.credor(Carteira)


      if(Status == 'Acordo'){
        agent.add(`Você já tem um acordo vigente com a ${credorform}`);

        agent.add(`Recebeu o boleto? Caso não é só dizer "não recebi o boleto"`);
        agent.add(`Tem alguma outra dúvida? ligue ${telsmagno}`);

      } else if (Status == 'Devolvido') { 
        agent.add(`Poxa !! Vi que retiram seu contrato daqui, vou pedir que procure a empresa credora`); 
      
      }  else if (typeof maiscontr.Contratos[0].Contrato[1] != 'undefined') { 
        agent.add(`Você tem mais de um contrato conosco, segue as informações`); 
        let ctr2 = maiscontr.Contratos[0].Contrato
        ctr2.map(ctrs => {
          agent.add(`Empresa: ${x.credor(ctrs.NomeCarteira)}. Código:${ctrs.IdContr}. Situação: ${ctrs.Status}`); 
        })
        agent.add(`Anote ou copie o código da empresa que quer negociar`); 
        agent.add(`e depois digite a frase 👉"verificar código"👈 para continuar`);
    
      } else if (Status == 'Cobrança') { 
      agent.add(`Consultei o seu CPF:${cpf}`);
      agent.add(`Existe um contrato com a ${credorform}`)
      agent.add(`Em nome de ${Nome}`)
      agent.add(`Confirma?`)
      }
      agent.context.set({
        'name':'cslog',
        'lifespan': 15,
        'parameters':{
          'IdContr':IdContr,
          'Nome':Nome,
          'MaxParc':MaxParc,
          'Parcel':Parcel,
          'Status':Status,
          'QtdeParcAtr':QtdeParcAtr,
          'vencdisp':vencperm,
          'vencperm':adddias.toISOString().split('T')[0],
          'NumContr':NumContr,
          'PercDescTab':PercDescTab,
          'Carteira':credorform,
          'telsmagno':telsmagno

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
    let telsmagno   = calc.parameters.telsmagno
    agent.add(`${Nome}`)
    let motivo = calc.parameters.motivo
    let tel    = calc.parameters.tel
    let id     = calc.parameters.IdContr
    agent.add(`Ok . . . compreendemos !
    Vou te passar os valores que constam em aberto, até a presente data.`)
    return axios.get(`http://127.0.0.1:1880/acionar?id=${id}&tel=${tel}&cod=327&climsg=MOTIVO DE ATRASO: ${motivo}`)
    .then(() => {
            return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
            .then((result) => {
              let valor = result.data.XML.Calculo[0].TotalSemDesc
              let titulos = result.data.XML.Calculo[0].Detalhes
              agent.add(`${titulos}`)  
              agent.add(`O valor atualizado até hoje é de R$${valor}`)
              agent.add(`Preciso saber a forma de pagamento? (A vista ou Parcelado?)`)
               })
    })
    .catch (error => {
      agent.add(`Ops, seu contrato foi bloqueado, vou pedir que ligue urgente para ${telsmagno}`)
  })
 
  }
  function neg_outr_ctr(agent){
  const id = agent.parameters.id;
  return axios.get(`http://127.0.0.1:1880/buscarid?id=${id}`)
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
      let Carteira    = result.data.XML.Contratos[0].Contrato[0].NomeCarteira
      let telsmagno   = result.data.XML.Contratos[0].Contrato[0].TelRetorno
      let vencperm    = vencdisp.slice(11,21) 
      
      agent.context.set({
        'name':'contatopositivo',
        'lifespan': 20,
      });
      agent.context.set({
        'name':'cslog',
        'lifespan': 40,
        'parameters':{
          'IdContr':IdContr,
          'Nome':Nome,
          'MaxParc':MaxParc,
          'Parcel':Parcel,
          'Status':Status,
          'QtdeParcAtr':QtdeParcAtr,
          'vencdisp':vencdisp,
          'NumContr':NumContr,
          'PercDescTab':PercDescTab,
          'Carteira':Carteira,
          'telsmagno':telsmagno
          }  
        })
        agent.setFollowupEvent('MOTIVOINDP');
        agent.add(`transferindo`)
    })
    .catch (error => {
      agent.add(`O código que você me passou está errado ou indisponível para continuar`)
      agent.add(`Vou pedir que entre em contato no ${telsmagno}`)

  })
  }

  function registrarproposta(agent){
    const proposta  = agent.parameters.proposta
    let calc        = agent.context.get('cslog')
    let IdContr     = calc.parameters.IdContr
    let tel         = calc.parameters.tel
    let telsmagno   = calc.parameters.telsmagno

    return axios.get(`http://127.0.0.1:1880/acionar?id=${IdContr}&tel=${tel}&cod=368&climsg=PROPOSTA: ${proposta}`)
    .then(() => {
        agent.add(`Ok, registrei que não tem condições, entraremos em contato em breve para conversar. Mantenha seu telefone ligado`)
        agent.add(`Caso queira entrar em contato conosco ligue ${telsmagno}`)

               })
    .catch (error => {
      agent.add(`Ops, seu contrato foi bloqueado, vou pedir que ligue urgente para ${telsmagno}`)
  })
 
  }
   function reenvioboleto(agent){
    const cpf = agent.parameters.cpf;
    const email = agent.parameters.email;
    return axios.get(`http://127.0.0.1:1880/buscarcpf?cpf=${cpf}`)
    .then((result) => {  
      let IdContr     = result.data.XML.Contratos[0].Contrato[0].IdContr
      let telsmagno   = result.data.XML.Contratos[0].Contrato[0].TelRetorno
      axios.get(`http://127.0.0.1:1880/email?id=${IdContr}&email=${email}`)
      return axios.get(`http://127.0.0.1:1880/reenvio?id=${IdContr}&email=${email}`)
    .then((result) => {
     let status = result.data.XML.Retorno[0].Status
     if(status == 'ERRO'){
      agent.add(`Não consegui solicitar o reenvio do boleto, vou pedir que entre em contato no ${telsmagno}`) 
     } else {
      agent.add(`já solicitei que reenviem o boleto no seu email:${email},agora é só aguardar`)
      agent.add(`Caso tenha alguma outra dúvida entre em contato ${telsmagno}`)
     }
    });
  })
  .catch (error => {
    agent.add(`Ops,não consegui reenviar o seu boleto, favor entre em contato conosco.tels: ${telsmagno}`)
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
        agent.add(`Conseguimos o valor a vista até ${clienteptdate} por: R$${descvista}`);  
        agent.add(`Podemos registrar seu acordo?`); 
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
            agent.add(`Podemos registrar seu acordo?`)
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
              .catch (error => { 
                agent.add(`nâo conseguir seguir com a solicitação, tente mais tarde`)
              })
  }
  function Parcelamento(agent) {
    const calc          = agent.context.get('cslog')
    const IdContr       = calc.parameters.IdContr
    const QtdeParcAtr   = calc.parameters.QtdeParcAtr
    let vencperm        = calc.parameters.vencperm
    let maisparcelas    = calc.parameters.Parcel[0]
    let cond2parcws     = maisparcelas.slice(2,3)

    return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${cond2parcws}&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
        result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
          let x = parseInt(cob.NumParc[0]);
          let venc = dateToPT(cob.Vencimento[0]);
          agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
        })    
      agent.add(`Podemos registrar seu acordo ?`)
      agent.context.set({
        'name':'condAC',
        'lifespan': 5,
        'parameters':{
          'desconto':0,
          'parcela':cond2parcws
          }
      });
      
       })
       .catch (error => {
        agent.add(`Infelizmente não consegui parcelar o seu contrato. Diga a vista para seguirmos com a negociação`)
      });
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
  agent.setFollowupEvent('cadastrarend'); //followup end
}
function emailconfirmado(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('gravarac'); //followup end
}
function gravaracoutroparc(agent) { 
  agent.add(`transferindo`)
  agent.setFollowupEvent('inputemail'); //followup end
}
//end event itents
function nuevovenc(agent) {
  const date = agent.parameters.date;
    agent.add(`Alterei o vencimento para o dia ${dateToPT(date.slice(0,10))}`)
    agent.add(`Você queria a vista ou parcelado?`)
    agent.context.set({
      'name':'cslog',
      'lifespan': 15,
      'parameters':{
        'vencperm': date.slice(0,10)
        }
    });
  }

function parcmaior(agent) {
  const calc          = agent.context.get('cslog')
  const IdContr       = calc.parameters.IdContr
  const QtdeParcAtr   = calc.parameters.QtdeParcAtr
  let vencperm        = calc.parameters.vencperm
  let maisparcelas    = calc.parameters.Parcel[0]
  let cond2parcws     = maisparcelas.slice(4,5)
  return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${cond2parcws}&qpo=${QtdeParcAtr}&desc=0`)
  .then((result) => {
      result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
        let x = parseInt(cob.NumParc[0]);
        let venc = dateToPT(cob.Vencimento[0]);
        agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
      })    
    agent.add(`Aceita o acordo nestas condições? (Sim ou não? ??)`)
    agent.context.set({
      'name':'condAC',
      'lifespan': 15,
      'parameters':{
        'desconto':0,
        'parcela':cond2parcws
        }
    });
    
     })
     .catch (error => {
      agent.add(`Infelizmente não consegui😔. Fiz até um esforço mas a melhor proposta parcelada foi a que te disse antes`)
      agent.add(`Ei, aproveite antes que mudem a proposta, diga parcelado para continuarmos com aquela negociação`)

    });
}

function ultimacondparc(agent) {
  const calc          = agent.context.get('cslog')
  const IdContr       = calc.parameters.IdContr
  const QtdeParcAtr   = calc.parameters.QtdeParcAtr
  let vencperm        = calc.parameters.vencperm
  const MaxParc       = calc.parameters.MaxParc

  return axios.get(`http://127.0.0.1:1880/simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${MaxParc}&qpo=${QtdeParcAtr}&desc=0`)
  .then((result) => {
      result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
        let x = parseInt(cob.NumParc[0]);
        let venc = dateToPT(cob.Vencimento[0]);
        agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
      })    
    agent.add(`Esta é a melhor proposta possível para seu contrato, diga sim para formalizar o acordo`)
    agent.context.set({
      'name':'condAC',
      'lifespan': 15,
      'parameters':{
        'desconto':0,
        'parcela':MaxParc
        }
    });
    
     })
     .catch (error => {
      agent.add(`Infelizmente não consegui😔. Fiz até um esforço mas a melhor proposta parcelada foi a que te disse antes`)

    });
}

function contatos (agent) { 
  let contextIn  = agent.context.get('cslog')
  let telsmagno  = contextIn.parameters.telsmagno
  agent.add(`Você pode ligar no ${telsmagno}`)
}

function gravarac (agent) { 
  let contextIn      = agent.context.get('cslog')
    let IdContr      = contextIn.parameters.IdContr
    let QtdeParcAtr  = contextIn.parameters.QtdeParcAtr  
    let vencperm     = contextIn.parameters.vencperm
    let email        = contextIn.parameters.email
    let telsmagno    = contextIn.parameters.telsmagno
    let x            = agent.context.get('condac')
    let gravacomdesc = x.parameters.desconto
    let parcela      = x.parameters.parcela
    return axios.get(`http://127.0.0.1:1880/gravadesc?id=${IdContr}&venc=${vencperm}&parc=${parcela}&qpo=${QtdeParcAtr}&email=${email}&desc=${gravacomdesc}`)
    .then((result) => {
      var venc          = result.data.XML.Boleto[0].Vencimento[0]
      var email         = result.data.XML.Boleto[0].EnvioPara[0]
      var clienteptdate = dateToPT(venc)
      agent.add(`Formalizei seu acordo, aguarde que em breve o boleto estará disponível em: ${email}`)
      agent.add(`⚠Atenção, caso não ocorra o pagamento até o vencimento ${clienteptdate} as condições aqui formalizadas serão perdidas⚠`)  
      agent.add(`Dúvidas? me ligue ☎️ ${telsmagno}`)    
  }) 
     .catch (error => {
      agent.add(`Não consegui gravar o seu acordo, vou precisar que ligue para ${telsmagno}`)
    });
}

function contestadeb(agent){
  const argumento = agent.parameters.argumento
  let calc        = agent.context.get('cslog')
  let IdContr     = calc.parameters.IdContr
  let tel         = calc.parameters.tel
  let telsmagno   = calc.parameters.telsmagno

  return axios.get(`http://127.0.0.1:1880/acionar?id=${IdContr}&tel=${tel}&cod=80&climsg=CONTESTOU:${argumento}`)
  .then(() => {
      agent.add(`Registrei sua reclamação, estaremos avaliando com a empresa credora e entraremos em contato em breve para conversar. Mantenha seu telefone ligado`)
      agent.add(`Se já quiser conversar com a gente os telefones são ${telsmagno} `);
    })
  .catch (error => {
    agent.add(`Vou pedir para ligar no ${telsmagno}`)
})
}
function addcep(agent){
  let inctx   = agent.context.get('cslog')
  let IdContr = inctx.parameters.IdContr
  const cep   = agent.parameters.cep
  const compl = agent.parameters.compl
  const num   = agent.parameters.num
  const cepws = cep.replace("-","")

  agent.add(`Consulta cep`)
  return axios.get(`https://viacep.com.br/ws/${cep}/json/`)
  .then((result) => {
    let zc     = result.data
    let end    = zc.logradouro
    let bairro = zc.bairro
    let city   = zc.localidade
    let uf     = zc.uf
    return axios.get(`http://127.0.0.1:1880/endereco?id=${IdContr}&cep=${cepws}&end=${end}&num=${num}&compl=${compl}&bairro=${bairro}&city=${city}&uf=${uf}`)
      .then((result) => {
        agent.add(`transferindo`)
        agent.setFollowupEvent('inputemail'); //followup end
    })
  })
  .catch (error => {
    agent.add(`Erro, não consegui localizar o CEP`)
})
}

function addDays(date, day) {
  var d = new Date(date);
  d.setDate(d.getDate() + day);
  var n = d.getDay();
   if( n == 5 || n == 6)
  return addDays(d, 2)
  else
  return d
  }

  let intentMap = new Map()
  intentMap.set('negociar', buscarcpf);
  intentMap.set('negociar-yes', negociarsim);
  intentMap.set('MOTIVOINDP', MOTIVOINDP); 
  intentMap.set('condavista', avista);
  intentMap.set('condparcelada', Parcelamento);  
  intentMap.set('neg_outr_ctr', neg_outr_ctr);  
  intentMap.set('acordoavistaformalizado', aceitouavista); 
  intentMap.set('reenvioboleto', reenvioboleto); 
  intentMap.set('gravarac', gravarac);  
  intentMap.set('condparcelada-sim', aceitouparcelamento);  
  intentMap.set('emailconfirmado', emailconfirmado);  
  intentMap.set('condparcelada-no-outroparc', parcmaior);  
  intentMap.set('condparcelada-no-outroparc-sim', gravaracoutroparc);
  intentMap.set('ultimacondparc', ultimacondparc);  
  intentMap.set('registrarproposta', registrarproposta);
  intentMap.set('condavista_new_venc', nuevovenc);    
  intentMap.set('contestadeb', contestadeb);  
  intentMap.set('contatos', contatos);  
  intentMap.set('addcep', addcep);
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)