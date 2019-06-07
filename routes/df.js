'use strict';
const x = require('./credor.js')
const v = require('./datas.js')
const frases = require('./frases.js');
const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const axios = require('axios');
const hj = new Date()
app.get('/', (req, res) => res.send('online'))
app.post('/dialogflow', express.json(), (req, res) => {
const agent = new WebhookClient({ request: req, response: res })
const endpoint= 'http://127.0.0.1:1880/'
  
    function buscarcpf (agent) {
    let cpf = agent.parameters.cpf;
    let pattern = /(^\d{3}\.\d{3}\.\d{3}\-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$)/;
    if (cpf.length !== 11) {
    agent.add(frases.cpf);
    } else if (cpf.match(pattern) !== null) {
    agent.add(frases.cpfinválido);
    } else {

    return axios.get(`${endpoint}buscarcpf?cpf=${cpf}`)
    .then((result) => {
    let dados = result.data.XML.Contratos[0].Contrato[0] 
    let IdContr     = dados.IdContr
    let Nome        = dados.Nome
    let MaxParc     = dados.MaxParcelamento
    let Parcel      = dados.Parcelamentos
    let Status      = dados.Status
    let QtdeParcAtr = dados.QtdeParcAtraso
    let vencdisp    = dados.Vencimentos[0]
    let NumContr    = dados.NumContrato
    let PercDescTab = dados.PercDescTab[0]
    let Carteira    = dados.NomeCarteira
    let telsmagno   = dados.TelRetorno
    let maiscontr   = result.data.XML
    let vencperm    = vencdisp.slice(11,21) 
    let adddias     = addDays(vencperm, 3);
    let credorform  = x.credor(Carteira)
    let teste       = v.meuvct(hj,vencperm)
    if(Status == 'Acordo'){
    agent.add(`Você já tem um acordo vigente com a ${credorform}`);

    agent.add(`${frases.askrecebeublt}`);
    agent.add(`Tem alguma outra dúvida? ligue ${telsmagno}`);

    } else if (Status == 'Devolvido') { 
    agent.add(frases.devolvido); 

    }  else if (typeof maiscontr.Contratos[0].Contrato[1] != 'undefined') { 
    agent.add(frases.maiscontratos); 
    let ctr2 = maiscontr.Contratos[0].Contrato
    ctr2.map(ctrs => {
    agent.add(`Empresa: ${x.credor(ctrs.NomeCarteira)}. Código:${ctrs.IdContr}. Situação: ${ctrs.Status}`); 
    })
    agent.add(frases.maiscontratos2); 
    agent.add(frases.maiscontratos3);

    } else if (Status == 'Cobrança') { 
    agent.add(`Consultei o seu CPF:${cpf}`);
    agent.add(`Existe um contrato com a ${credorform}`)
    agent.add(`Em nome de ${Nome}`)
    agent.add(`Confirma?`)
    }
    agent.context.set({ 'name':'cslog','lifespan': 15,'parameters':{
    'IdContr':IdContr,'Nome':Nome,'MaxParc':MaxParc,'Parcel':Parcel,
    'Status':Status,'QtdeParcAtr':QtdeParcAtr,'vencdisp':vencperm,
    'vencperm':adddias.toISOString().split('T')[0],'NumContr':NumContr,
    'PercDescTab':PercDescTab,'Carteira':credorform,'telsmagno':telsmagno}});
    })
    .catch (error => {
    agent.add(frases.errobuscarcpf1);
    agent.add(frases.errobuscarcpf2); 
    agent.add(frases.errobuscarcpf3); 
    agent.add(frases.errobuscarcpf4); 
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
    agent.add(frases.compreendemos)
    return axios.get(`${endpoint}acionar?id=${id}&tel=${tel}&cod=327&climsg=MOTIVO DE ATRASO:${motivo}`)
    .then(() => {
    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
    let valor   = result.data.XML.Calculo[0].TotalSemDesc
//    let titulos = result.data.XML.Calculo[0].Detalhes
//    agent.add(`${titulos}`)  
    agent.add(`O valor atualizado até hoje é de R$${valor}`)
    agent.add(frases.askformadepgto)
    })
    })
    .catch (error => {
    agent.add(`${frases.errogeral} ${telsmagno}`)
    })
    }
    function neg_outr_ctr(agent){
    const id = agent.parameters.id;
    return axios.get(`${endpoint}buscarid?id=${id}`)
    .then((result) => {
    let dados = result.data.XML.Contratos[0].Contrato[0]
    let IdContr     = dados.IdContr
    let Nome        = dados.Nome
    let MaxParc     = dados.MaxParcelamento
    let Parcel      = dados.Parcelamentos
    let Status      = dados.Status
    let QtdeParcAtr = dados.QtdeParcAtraso
    let vencdisp    = dados.Vencimentos[0]
    let NumContr    = dados.NumContrato
    let PercDescTab = dados.PercDescTab[0]
    let Carteira    = dados.NomeCarteira
    let telsmagno   = dados.TelRetorno
    let vencperm    = vencdisp.slice(11,21) 

    agent.context.set({'name':'contatopositivo','lifespan': 20,});
    agent.context.set({'name':'cslog','lifespan': 40,'parameters':{'IdContr':IdContr,'Nome':Nome,
    'MaxParc':MaxParc,'Parcel':Parcel,'Status':Status,'QtdeParcAtr':QtdeParcAtr,'vencdisp':vencperm,
    'NumContr':NumContr,'PercDescTab':PercDescTab,'Carteira':Carteira,'telsmagno':telsmagno}})
    agent.setFollowupEvent('MOTIVOINDP');
    agent.add(`transferindo`)})
    .catch (error => {
    agent.add(frases.erroverificarcod)
    agent.add(`${frases.meliga} ${telsmagno}`)})
    }

    function registrarproposta(agent){
    let proposta  = agent.parameters.proposta
    let calc      = agent.context.get('cslog')
    let IdContr   = calc.parameters.IdContr
    let tel       = calc.parameters.tel
    let telsmagno = calc.parameters.telsmagno

    return axios.get(`${endpoint}acionar?id=${IdContr}&tel=${tel}&cod=368&climsg=PROPOSTA: ${proposta}`)
    .then(() => {
    agent.add(frases.semcondicoes)
    agent.add(`${frases.falarconosco} ${telsmagno}`)
    })
    .catch (error => {agent.add(`${frases.errogeral} ${telsmagno}`)})
    }

    function reenvioboleto(agent){
    let cpf = agent.parameters.cpf;
    let email = agent.parameters.email;
    return axios.get(`${endpoint}buscarcpf?cpf=${cpf}`)
    .then((result) => {  
    let IdContr     = result.data.XML.Contratos[0].Contrato[0].IdContr
    let telsmagno   = result.data.XML.Contratos[0].Contrato[0].TelRetorno
    axios.get(`${endpoint}email?id=${IdContr}&email=${email}`)
    return axios.get(`${endpoint}reenvio?id=${IdContr}&email=${email}`)
    .then((result) => {
    let status = result.data.XML.Retorno[0].Status
    if(status == 'ERRO'){
    agent.add(`${frases.erroreenvio} ${telsmagno}`) 
    } else {
    agent.add(`${frases.solicreenvio}${email},agora é só aguardar`)
    agent.add(`${frases.telsduvidas} ${telsmagno}`)
    }
    });
    })
    .catch (error => {
    agent.add(`${frases.falhareenvio} ${telsmagno}`)
    })
    }

    function avista (agent) {
    let calc          = agent.context.get('cslog')
    let IdContr       = calc.parameters.IdContr
    let QtdeParcAtr   = calc.parameters.QtdeParcAtr
    let vencperm      = calc.parameters.vencperm
    let PercDescTab   = calc.parameters.PercDescTab
    let desconto      = check(PercDescTab)
    let clienteptdate = dateToPT(vencperm)

    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=${desconto}`)
    .then((result) => {
    let descvista = result.data.XML.Calculo[0].Total
    agent.add(`Conseguimos o valor a vista até ${clienteptdate} por: R$${descvista}`);  
    agent.add(frases.askregistraac); 
    agent.context.set({'name':'condAC','lifespan': 15,'parameters':{'desconto':desconto,'parcela':1}});
    })
    .catch (error => { //Caso webservice não libere desconto
    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=1&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
    let calculo = result.data.XML.Calculo[0].Total
    agent.add(frases.semdesconto);  
    agent.add(`fica a vista por R$${calculo}`); 
    agent.add(`Com vencimento para ${clienteptdate}`);
    agent.add(frases.askregistraac)

    agent.context.set({'name':'condAC','lifespan': 15,'parameters':{
    'desconto':0,'parcela':1}}); 
    })
    })
    .catch (error => { 
    agent.add(frases.errosolicita)
    })
    }

    function Parcelamento(agent) {
    let calc          = agent.context.get('cslog')
    let IdContr       = calc.parameters.IdContr
    let QtdeParcAtr   = calc.parameters.QtdeParcAtr
    let vencperm      = calc.parameters.vencperm
    let maisparcelas  = calc.parameters.Parcel[0]
    let cond2parcws   = maisparcelas.slice(2,3)

    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${cond2parcws}&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
    result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
    let x    = parseInt(cob.NumParc[0]);
    let venc = dateToPT(cob.Vencimento[0]);

    agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
    })    
    agent.add(`Podemos registrar seu acordo ?`)
    agent.context.set({
    'name':'condAC','lifespan': 5,'parameters':{'desconto':0,'parcela':cond2parcws}});
    })
    .catch (error => {
    agent.add(frases.naoavista)
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
    agent.setFollowupEvent('MOTIVOINDP'); 
    }
    function aceitouparcelamento(agent) { 
    agent.add(`transferindo`)
    agent.setFollowupEvent('cadastrarend');
    }
    function aceitouavista(agent) { 
    agent.add(`transferindo`)
    agent.setFollowupEvent('cadastrarend');
    }
    function emailconfirmado(agent) { 
    agent.add(`transferindo`)
    agent.setFollowupEvent('gravarac'); 
    }
    function gravaracoutroparc(agent) { 
    agent.add(`transferindo`)
    agent.setFollowupEvent('cadastrarend');
    }
    //end event itents
    function nuevovenc(agent) {
    let date = agent.parameters.date;
    agent.add(`Alterei o vencimento para o dia ${dateToPT(date.slice(0,10))}`)
    agent.add(`Você queria a vista ou parcelado?`)
    agent.context.set({'name':'cslog','lifespan': 15,'parameters':{
    'vencperm': date.slice(0,10)}});
    }

    function parcmaior(agent) {
    let calc          = agent.context.get('cslog')
    let IdContr       = calc.parameters.IdContr
    let QtdeParcAtr   = calc.parameters.QtdeParcAtr
    let vencperm      = calc.parameters.vencperm
    let maisparcelas  = calc.parameters.Parcel[0]
    let cond2parcws   = maisparcelas.slice(4,5)
    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${cond2parcws}&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
    result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
    let x = parseInt(cob.NumParc[0]);
    let venc = dateToPT(cob.Vencimento[0]);
    agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
    })    
    agent.add(frases.askregistraac)
    agent.context.set({'name':'condAC','lifespan': 15,'parameters':{'desconto':0,'parcela':cond2parcws}});

    })
    .catch (error => {
    agent.add(frases.melhorproposta)
    agent.add(frases.melhorproposta1)

    });
    }

    function ultimacondparc(agent) {
    let calc          = agent.context.get('cslog')
    let IdContr       = calc.parameters.IdContr
    let QtdeParcAtr   = calc.parameters.QtdeParcAtr
    let vencperm      = calc.parameters.vencperm
    let MaxParc       = calc.parameters.MaxParc

    return axios.get(`${endpoint}simulardesc?id=${IdContr}&vcto=${vencperm}&parc=${MaxParc}&qpo=${QtdeParcAtr}&desc=0`)
    .then((result) => {
    result.data.XML.Calculo[0].Parcelas[0].Parcela.map(cob => {
    let x = parseInt(cob.NumParc[0]);
    let venc = dateToPT(cob.Vencimento[0]);
    agent.add("Parcela "+x+": "+ "no valor de "+"R$:"+cob.Valor[0]+". Vencimento da fatura: "+venc);
    })    
    agent.add(frases.melhorproposta);
    agent.context.set({'name':'condAC','lifespan': 15,'parameters':{
    'desconto':0,'parcela':MaxParc}}); 
    })
    .catch (error => {
    agent.add(frases.melhorparcelado);
    });
    }

    function contatos (agent) { 
    let contextIn  = agent.context.get('cslog')
    let telsmagno  = contextIn.parameters.telsmagno
    agent.add(`Você pode ligar no ${telsmagno}`)
    }

    function gravarac (agent) { 
    let contextIn    = agent.context.get('cslog')
    let IdContr      = contextIn.parameters.IdContr
    let QtdeParcAtr  = contextIn.parameters.QtdeParcAtr  
    let vencperm     = contextIn.parameters.vencperm
    let email        = contextIn.parameters.email
    let telsmagno    = contextIn.parameters.telsmagno
    let x            = agent.context.get('condac')
    let gravacomdesc = x.parameters.desconto
    let parcela      = x.parameters.parcela
    return axios.get(`${endpoint}gravadesc?id=${IdContr}&venc=${vencperm}&parc=${parcela}&qpo=${QtdeParcAtr}&email=${email}&desc=${gravacomdesc}`)
    .then((result) => {
    let venc          = result.data.XML.Boleto[0].Vencimento[0]
    let email         = result.data.XML.Boleto[0].EnvioPara[0]
    let clienteptdate = dateToPT(venc)
    agent.add(`${frases.acordo} ${email}`)
    agent.add(`${frases.avisoacordo1} ${clienteptdate} ${frases.avisoacordo2}`)  
    agent.add(`${frases.telsduvidas} ${telsmagno}`)    
    }) 
    .catch (error => {
    agent.add(`${frases.errogravarac} ${telsmagno}`)
    });
    }

    function contestadeb(agent){
    const argumento = agent.parameters.argumento
    let calc        = agent.context.get('cslog')
    let IdContr     = calc.parameters.IdContr
    let tel         = calc.parameters.tel
    let telsmagno   = calc.parameters.telsmagno

    return axios.get(`${endpoint}acionar?id=${IdContr}&tel=${tel}&cod=80&climsg=CONTESTOU:${argumento}`)
    .then(() => {
    agent.add(frases.contesta)
    agent.add(`${frases.tels} ${telsmagno} `);
    })
    .catch (error => {
    agent.add(`${frases.meliga} ${telsmagno}`)
    })
    }
    function addcep(agent){
    let inctx   = agent.context.get('cslog')
    let IdContr = inctx.parameters.IdContr
    let cep     = agent.parameters.cep
    let compl   = agent.parameters.compl
    let num     = agent.parameters.num
    let cepws   = cep.replace("-","")
    return axios.get(`https://viacep.com.br/ws/${cep}/json/`)
    .then((result) => {
    let zc     = result.data
    let end    = zc.logradouro
    let bairro = zc.bairro
    let city   = zc.localidade
    let uf     = zc.uf

    return axios.get(`${endpoint}endereco?id=${IdContr}&cep=${cepws}&end=${end}&num=${num}&compl=${compl}&bairro=${bairro}&city=${city}&uf=${uf}`)
    .then((result) => {
    agent.add(`transferindo`)
    agent.setFollowupEvent('inputemail'); //followup end
    })
    })
    .catch (error => {
    agent.add(frases.errogenerico)
    })
    }

    function addDays(date, day) {
    let d = new Date(date);
    d.setDate(d.getDate() + day);
    let n = d.getDay();
    if( n == 0 || n == 6)
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