const express = require('express')
const app = express()
const port = 8080

app.get('/todo/1', (req, res) => {
  res.json({
      "completed": false,
      "id": 1,
      "title": "delectus aut autem",
      "userId": 1,
    })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// To make nodejs handle docker stop signal
process.on('SIGTERM', () => {
  console.log("shutting down...")
  process.exit(0)
})