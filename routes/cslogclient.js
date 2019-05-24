module.exports = app => {
'use strict';
const { soap } = require('strong-soap');
const bodyParser = require('body-parser');
const clientPromises = new Map();
app.use(bodyParser.json())
    .post('/soap', ({ body: { wsdlUrl, operation, requests } }, res) => (
        getClient(wsdlUrl).then(client => ({ client, operation, requests }))
            .then(invokeOperations)
            .then(results => res.status(200).send(results))
            .catch(({ message: error }) => res.status(500).send({ error }))
    ))
const getClient = wsdlUrl => clientPromises.get(wsdlUrl)
    || (clientPromises.set(wsdlUrl, new Promise((resolve, reject) => (
        soap.createClient(wsdlUrl, {}, (err, client) => err ? reject(err) : resolve(client))
    ))).get(wsdlUrl));
const invokeOperations = ({ client, operation, requests }) => (Promise.all(requests.map(request => (
    new Promise((resolve, reject) => client[operation](request, (err, result) => (
        err ? reject(err) : resolve(result))
    ))
))));
}