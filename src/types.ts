export type TransactionType =  ' income' | 'expanse'

export interface Transaction {
     id : string 
     title : string 
     amount : number 
     type : TransactionType 
     createdAt: Date;
}