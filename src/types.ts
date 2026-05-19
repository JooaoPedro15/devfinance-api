export type TransactionType = 'income' | 'expense'

export interface Transaction {
     id: string
     title: string
     amount: number
     type: TransactionType
     category: string
     createdAt: string
     updatedAt: string
}

export interface Summary {
     income: number
     expense: number
     balance: number
}
