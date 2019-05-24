import bodyParser from 'body-parser'
module.exports = app => {
  app.use(bodyParser.json())
}