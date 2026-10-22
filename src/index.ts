import path from 'node:path'

import express from 'express'
import type { NextFunction, Request, Response } from 'express'

import {
    createTransaction,
    deleteTransaction,
    findTransaction,
    getSummary,
    listTransactions,
    updateTransaction,
} from './controllers/transactions.controller'
import { ensureSeedData } from './seed'

const app = express ()
app.use (express.json ())

// Build do front em React (dist/web), que inclui a documentação Swagger em /docs
app.use(express.static(path.resolve(process.cwd(), 'dist', 'web')))

app.get ('/api', (req, res) =>{
    res.json({
        message: 'DevFinance API rodando!',
        docs: '/docs',
        routes: [
            'GET /transactions',
            'GET /transactions/:id',
            'POST /transactions',
            'PUT /transactions/:id',
            'DELETE /transactions/:id',
            'GET /summary',
        ],
    })

})

app.get('/transactions', listTransactions)
app.get('/transactions/:id', findTransaction)
app.post('/transactions', createTransaction)
app.put('/transactions/:id', updateTransaction)
app.delete('/transactions/:id', deleteTransaction)
app.get('/summary', getSummary)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error)

    return res.status(500).json({
        message: 'Internal server error',
    })
})

const port = Number(process.env.PORT) || 3000

ensureSeedData().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`)
    })
})
