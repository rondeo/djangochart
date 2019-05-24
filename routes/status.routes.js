 module.exports = app => {
    app.get('/teste', (req, res) => {
      res.json({ status: 'Server is running!' })
    })  }