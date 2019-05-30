  module.exports = app => {
    const users = [
      { name: 'test', email: 'test@hotmail.com' }
    ]
    app.get('/users', (req, res) => {
      res.json(users)
    })
    app.post('/users', (req, res) => {
      users.push(req.body)
      res.json({ status: 'User created successfully!' })
    })  }
  