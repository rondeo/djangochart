
   function gravadordeac(agent) { 
    let contextIn      = agent.context.get('cslog')
    let IdContr        = contextIn.parameters.IdContr
    let QtdeParcAtr    = contextIn.parameters.QtdeParcAtr  
    let email          = contextIn.parameters.email
    let selcparc       = contextIn.parameters.formadepgto
    let calcvenc = diadocalculo()
    console.log(email) 
    return axios.get(`http://127.0.0.1:1880/grava?id=${IdContr}&venc=${calcvenc}&selcparc=${selcparc}&pcatr=${QtdeParcAtr}&email=${email}`)
    .then((result) => {
      var valor = result.data.XML.Calculo[0].TotalSemDesc
      var titulos = result.data.XML.Calculo[0].Detalhes
      agent.add(`Seu acordo foi formalizado, conte com a magno assessoria`)
       })
       .catch (error => {
        agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
    })
    
}
function gravarparc3x(agent) { 
  agent.add(`Vamos lá`)
  let contextIn      = agent.context.get('cslog')
  let IdContr        = contextIn.parameters.IdContr
  let QtdeParcAtr    = contextIn.parameters.QtdeParcAtr  
  let contextIn2     = agent.context.get('condparcelada-followup')
  let email          = contextIn2.parameters.email
  let calcvenc = diadocalculo() 
  return axios.get(`http://127.0.0.1:1880//gravadesc?id=${IdContr}&venc=${calcvenc}&selcparc=3&pcatr=${QtdeParcAtr}&email=${email}&desc=0`)
  .then((result) => {
    var valor = result.data.XML.Calculo[0].TotalSemDesc
    var titulos = result.data.XML.Calculo[0].Detalhes
    agent.add(`Seu acordo foi formalizado valor de ${valor}, conte com a magno assessoria`)
     })
     .catch (error => {
      agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
  })
  
}
function gravacustomparc(agent) { 
  let contextIn      = agent.context.get('cslog')
  let IdContr        = contextIn.parameters.IdContr
  let QtdeParcAtr    = contextIn.parameters.QtdeParcAtr  
  let email          = contextIn.parameters.email
  let calcvenc = diadocalculo() 
  return axios.get(`http://127.0.0.1:1880/grava?id=${IdContr}&venc=${calcvenc}&selcparc=3&pcatr=${QtdeParcAtr}&email=${email}`)
  .then((result) => {
    var valor = result.data.XML.Calculo[0].TotalSemDesc
    var titulos = result.data.XML.Calculo[0].Detalhes
    agent.add(`Seu acordo foi formalizado, conte com a magno assessoria`)
     })
     .catch (error => {
      agent.add(`Houve um erro ao executar esta ação, tente novamente mais tarde ou entre em contato conosco`)
  })
  
}