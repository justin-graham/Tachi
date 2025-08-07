declare module 'bcryptjs' {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>
  export function compareSync(data: string | Buffer, encrypted: string): boolean
  export function genSalt(rounds?: number): Promise<string>
  export function genSaltSync(rounds?: number): string
  export function getRounds(encrypted: string): number
  
  const bcrypt: {
    hash: typeof hash
    hashSync: typeof hashSync
    compare: typeof compare
    compareSync: typeof compareSync
    genSalt: typeof genSalt
    genSaltSync: typeof genSaltSync
    getRounds: typeof getRounds
  }
  
  export default bcrypt
}
