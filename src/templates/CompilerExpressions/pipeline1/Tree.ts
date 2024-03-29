import { Lexeme } from "./Lexeme";
import { Grammar } from "./Grammar";
import { Production } from "./Production";

export type ReactD3Tree = {
  name: string;
  children: ReactD3Tree[];
};

export class Tree {
  _simbolo: string;
  _nos: Tree[];
  _extra: Lexeme | null;

  constructor(simbolo: string) {
    this._simbolo = simbolo;
    this._nos = [];
    this._extra = null;
  }

  get simbolo() {
    return this._simbolo;
  }
  get nos() {
    return [...this._nos];
  }
  get ehFolha() {
    return this._nos.length === 0;
  }
  get extra() {
    return this._extra;
  }
  set extra(extra) {
    this._extra = extra;
  }

  emOrdem(handle: (arv: Tree) => void) {
    for (const no of this._nos) no.emOrdem(handle);
    handle(this);
  }

  preOrdem(handle: (arv: Tree) => void) {
    handle(this);
    for (const no of this._nos) no.preOrdem(handle);
  }

  preOrdemMaxNivel(
    handle: (arv: Tree) => void,
    maxNivel: number,
    atual: number
  ) {
    handle(this);
    if (maxNivel <= atual) return;
    for (const no of this._nos)
      no.preOrdemMaxNivel(handle, maxNivel, atual + 1);
  }

  postOrder(handle: (arv: Tree) => void) {
    handle(this);
    for (const no of this.nos.reverse()) no.postOrder(handle);
  }

  /** 
        Função recursiva que busca todos os nós com um dado símbolo na árvore. Utiliza a varredura PRE-ORDEM
    **/
  findAllNodes(simbolo: string, maxNivel?: number) {
    const listaNos: Tree[] = [];

    if (maxNivel !== undefined && maxNivel > 0) {
      this.preOrdemMaxNivel(
        (no: Tree) => {
          if (no.simbolo === simbolo) listaNos.push(no);
        },
        maxNivel,
        0
      );
    } else {
      this.preOrdem((no: Tree) => {
        if (no.simbolo === simbolo) listaNos.push(no);
      });
    }

    return listaNos;
  }

  static parseProductions(prods: Production[], gram: Grammar) {
    return Tree._parseProductionsRight(prods, gram);
  }

  static _parseProductionsRight(prods: Production[], gram: Grammar) {
    // Remove a primeira produção da lista
    const p = prods.shift();

    // Se não for válida, retorna null
    if (p === undefined) return null;

    // Cria um nó com o símbolo da cabeça da produção
    const no = new Tree(p.cabeca);

    // Para cada símbolo do corpo...
    for (const s of p.corpo.reverse()) {
      // Se ele for um terminal, apenas cria um nó e o adiciona como filho
      if (!gram.isNonTerminalSymbol(s)) {
        no._nos.unshift(new Tree(s));
        continue;
      }

      // Se for um não terminal, chama recursivamente esta função
      const noFilho = Tree._parseProductionsRight(prods, gram);

      // Se o nó retornado for válido, adiciona-o como filho
      if (noFilho !== null) no._nos.unshift(noFilho);
    }

    // Retorna o nó criado
    return no;
  }
}

export function getReactD3Tree(tree: Tree) {
  const d3: ReactD3Tree = { name: tree.simbolo, children: [] };
  tree._nos.forEach((node, index) => {
    d3.children.push(getReactD3Tree(node));
  });

  if (
    tree.nos.length === 0 &&
    tree.extra &&
    tree.simbolo !== tree.extra.palavra
  ) {
    d3.children.push({ name: tree.extra.palavra, children: [] });
  }
  return d3;
}
