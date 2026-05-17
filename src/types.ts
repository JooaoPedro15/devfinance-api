export type TransactionType = 'income' | 'expense'

export interface Transaction {
     id : string 
     title : string 
     amount : number 
     type : TransactionType 
     createdAt: Date;
}