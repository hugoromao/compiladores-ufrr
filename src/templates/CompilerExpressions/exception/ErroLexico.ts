import { Lexeme } from "../lexico/Lexeme";

export type CustomError = { detalhes?: { encontrado: Lexeme } } & Error

export default function ErroLexico(encontrado: Lexeme) {
    const exc: CustomError = new Error('Erro léxico');
    exc.detalhes = { encontrado: encontrado };
    return exc;
}