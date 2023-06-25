import ErroGramatical from "../exception/ErroGramatical";
import getType from "../getType";
import { Grammar } from "./Grammar";
import LexicoBuffer from "./TokensStack";
import { Lexeme } from "./Lexeme";

export class WeakPrecedenceParser {
  _tabelaDR: { [key: string]: any };
  _gramatica: Grammar;
  _inicial: string;
  _fdc: string;

  constructor(gram: Grammar, inicial: string, fdc: string) {
    this._tabelaDR = WeakPrecedenceParser._createDRTable(gram, inicial, fdc);
    this._gramatica = gram;
    this._inicial = inicial;
    this._fdc = fdc;
  }

  analisar(buffer: LexicoBuffer) {
    // Cria a pilha com o símbolo inicial e o símbolo de fim de cadadeia
    const pilha: any = [this._fdc];

    // Guarda todoas as produçòes da gramática
    const prods = this._gramatica.producoes;

    // Lista vazia de produções resultantes da análise
    const prodsResultado = [];

    // Função para descobrir o tipo do token
    const tokenTipo = (l: Lexeme | string) =>
      getType(l) === "object" ? (l as Lexeme).token.tipo : l;

    // Ler o lexema atual
    let atual = buffer.proximo;

    // Enquanto tiver pelo menos 3 símbolos da pilha, OU não encontrar o fim
    // de cadeia da entrada E o topo da pilha não for o símbolo inicial
    const WeakPrecedenceLoop = () => {
      return (
        pilha.length > 2 ||
        !(
          tokenTipo(atual!) === this._fdc &&
          tokenTipo(pilha[0]) === this._inicial
        )
      );
    };

    // Para cada loop...
    while (WeakPrecedenceLoop()) {
      // Ler a ação da tabela DR no cruzamendo do símbolo do topo da pilha
      // (linha) e o símbolo atual da entrada (coluna)
      const acao =
        this._tabelaDR[tokenTipo(pilha[0]) as string][
        tokenTipo(atual!) as string
        ];

      // Se a ação for D (deslocamento)
      if (acao === "D") {
        pilha.unshift(atual!);
        atual = buffer.proximo;
        continue;
      }

      // Se a ação for R (redução)
      if (acao === "R") {
        // Calcula a quantidade de símbolos na pilha até o símbolo de
        // fim de cadeia
        let retirarPilha = pilha.length - 1;
        let prod = null;

        // Enquanto "retirarPilha" for maior que zero...
        while (retirarPilha > 0) {
          // Gera uma string com os símbolos do topo da pilha até o
          // valor de "retirarPilha" em ordem invertida
          const corpo = pilha
            .slice(0, retirarPilha)
            .map(tokenTipo)
            .reverse()
            .join(" ");

          // Procura uma produção com o corpo igual a string gerada
          prod = prods.find((p) => p.corpoStr === corpo);

          // Se encontrou uma produçao, para a busca
          if (prod !== undefined) break;
          // Se não, decrementa "retirarPilha"
          else retirarPilha--;
        }

        // Gera um erro, caso não tenha encontrado uma produção ao final
        // de todas as possiblidades de strings geradas a partir da pilha
        if (prod === null || prod === undefined) {
          throw ErroGramatical(atual as any);
        }

        // Remove da pilha todos os símbolos que casaram com o corpo da
        // produção encontrada
        pilha.splice(0, retirarPilha);

        // Adiciona ao topo da pilha o símbolo da cabeça da produção
        pilha.unshift(prod.cabeca);

        // Adiciona a produção a lista de produções da análise
        prodsResultado.unshift(prod);
        continue;
      }

      // Gera um erro caso não foi definida uma ação para o cruzamendo
      throw ErroGramatical(atual as any);
    }

    return prodsResultado;
  }

  static _createDRTable(gram: Grammar, inicial: string, fdc: string) {
    const WWrules = WeakPrecedenceParser._findWirthWeberComFdcRules(
      gram,
      inicial,
      fdc
    );

    // Defeine os símbolos das colunas da tabela
    const sColunas = [
      ...gram._terminais.filter((s: string) => !gram.isEmptySymbol(s)),
      fdc,
    ];

    // Define os símbolos das linhas da tabela
    const sLinhas = [...gram._naoTerminais, ...sColunas];

    // Cria um objeto vazio chave-valor para a tabela
    const tabela: { [key: string]: any } = {};

    // Para cada símbolo de linha...
    for (const sl of sLinhas) {
      // Cria um objeto vazio chave valor para a linha da tabela
      tabela[sl] = {};

      // Para cada símbolo de coluna...
      for (const sc of sColunas) {
        // Adiciona a ação D (deslocamento) para a relação <
        if (WWrules.includes([sl, "<", sc].join(""))) {
          tabela[sl][sc] = "D";
          continue;
        }

        // Adiciona a ação D (deslocamento) para a relação =
        if (WWrules.includes([sl, "=", sc].join(""))) {
          tabela[sl][sc] = "D";
          continue;
        }

        // Adiciona a ação R (redução) para a relação >
        if (WWrules.includes([sl, ">", sc].join(""))) {
          tabela[sl][sc] = "R";
          continue;
        }

        // Se não existe uma regra, deixa a celula vazia
        tabela[sl][sc] = null;
      }
    }

    return tabela;
  }

  static _findWirthWeberComFdcRules(
    gram: Grammar,
    inicial: string,
    fdc: string
  ) {
    const WWrules = WeakPrecedenceParser._findWirthWeberRules(gram);
    const esq = WeakPrecedenceParser._leftSet(gram);
    const dir = WeakPrecedenceParser._rightSet(gram);
    for (const s of esq[inicial]) WWrules.push([fdc, "<", s].join(""));
    for (const s of dir[inicial]) WWrules.push([s, ">", fdc].join(""));
    return WWrules;
  }

  static _findWirthWeberRules(gram: Grammar) {
    const prods = gram.producoes;
    const simbolos = [
      ...gram._naoTerminais,
      ...gram._terminais.filter((s) => !gram.isEmptySymbol(s)),
    ];

    const regras1 = [];
    for (const s of simbolos) {
      for (const p of prods) {
        // Regra 1: existe algum símbolo imediatamente a direita do símbolo
        // atual (A -> aXYb, onde Y esta imediatamente a direita de X)
        const pos = p.corpo.indexOf(s);
        if (pos === -1) continue;
        if (pos === p.corpo.length - 1) continue;
        regras1.push([s, "=", p.corpo[pos + 1]]);
      }
    }

    const esq = WeakPrecedenceParser._leftSet(gram);
    const dir = WeakPrecedenceParser._rightSet(gram);
    const regras2e3 = [];

    for (const r of regras1) {
      // Regra 2: esquerda qualquer símbolo e direita não terminal
      if (gram.isNonTerminalSymbol(r[2])) {
        for (const s of esq[r[2]]) {
          regras2e3.push([r[0], "<", s]);
        }
      }

      // Regra 3: esquerda sempre não terminal
      if (!gram.isNonTerminalSymbol(r[0])) continue;

      // Regra 3.2: direita não terminal
      if (gram.isNonTerminalSymbol(r[2])) {
        for (const sd of dir[r[0]]) {
          for (const se of esq[r[2]]) {
            regras2e3.push([sd, ">", se]);
          }
        }
      }
      // Regra 3.1: direita terminal
      else {
        for (const s of dir[r[0]]) {
          regras2e3.push([s, ">", r[2]]);
        }
      }
    }

    return [...regras1, ...regras2e3].map((e) => e.join(""));
  }

  static _leftSet(gram: Grammar) {
    const leftRecursive = (snt: string) => {
      let esq: string[] = [];
      const prods = gram.buscarProducoesPorNaoTerminal(snt);

      for (const p of prods) {
        if (!gram.isNonTerminalSymbol(p.corpo[0])) {
          esq.push(p.corpo[0]);
          continue;
        }

        if (p.corpo[0] === snt) continue;

        esq = [...esq, p.corpo[0], ...leftRecursive(p.corpo[0])];
      }

      return esq.filter((i, p) => esq.indexOf(i) === p);
    };

    const nonTerminals = gram._naoTerminais;
    const sets: { [key: string]: string[] } = {};

    for (const s of nonTerminals) {
      sets[s] = leftRecursive(s);
    }

    return sets;
  }

  static _rightSet(gram: Grammar) {
    const rightRecursive = (snt: string) => {
      let dir: string[] = [];
      const prods = gram.buscarProducoesPorNaoTerminal(snt);

      for (const p of prods) {
        const ultimoIndex = p.corpo.length - 1;

        if (!gram.isNonTerminalSymbol(p.corpo[ultimoIndex])) {
          dir.push(p.corpo[ultimoIndex]);
          continue;
        }

        if (p.corpo[ultimoIndex] === snt) continue;

        dir = [...dir, p.corpo[ultimoIndex], ...rightRecursive(p.corpo[ultimoIndex])];
      }

      return dir.filter((i, p) => dir.indexOf(i) === p);
    };

    const nonTerminals = gram._naoTerminais;
    const sets: { [key: string]: string[] } = {};

    for (const s of nonTerminals) {
      sets[s] = rightRecursive(s);
    }

    return sets;
  }
}