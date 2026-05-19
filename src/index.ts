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

const app = express ()
app.use (express.json ())

app.get ('/', (req, res) =>{
    res.json({
        message: 'DevFinance API rodando!',
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

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
})
