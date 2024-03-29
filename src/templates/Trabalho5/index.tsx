/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useRef, useState } from "react";

import Tree from "react-d3-tree";
import toast, { Toaster } from "react-hot-toast";

import CodeEditor from "components/CodeEditor";
import Description from "components/Description";
import {
  Table,
  TableDatacell,
  TableHeader,
  TableRow,
} from "components/Table/styles";

import LL1 from "./LL1";
import Grammar from "./Grammar";
import SyntaxTree from "./SyntaxTree";

import * as S from "./styles";

const Trabalho5Template = () => {
  const tree = useRef<HTMLDivElement>(null);

  const [arvore, setArvore] = useState<SyntaxTree | null>(null);
  const [gramaticaLL1, setGramaticaLL1] = useState<Grammar>();
  const [analisadorLL1, setAnalisadorLL1] = useState<LL1>();

  function onsubmit(sourceCode: string) {
    if (gramaticaLL1) {
      try {
        const prods = analisadorLL1?.analyse(sourceCode);
        const arvore = SyntaxTree._parseProductionsLeft(prods!, gramaticaLL1);
        setArvore(arvore);
        tree.current?.scrollIntoView();
      } catch {
        toast.error("Sentença não reconhecida");
        setArvore(null);
      }
    }
  }

  useEffect(() => {
    const gramaticaLL1 = Grammar.createGrammar(
      {
        E: ["MF"],
        F: ["+MF", "ε"], //E'
        M: ["PN"],
        N: ["xPN", "ε"], //M'
        P: ["(E)", "v"],
      },
      "ε"
    );

    setGramaticaLL1(gramaticaLL1);
    const analisadorLL1 = LL1.create(gramaticaLL1, "E", "$");
    setAnalisadorLL1(analisadorLL1);

    const prods = analisadorLL1?.analyse("v+v");
    const arvore = SyntaxTree._parseProductionsLeft(prods!, gramaticaLL1);
    setArvore(arvore);
  }, []);

  return (
    <>
      <S.Container>
        <S.Row>
          <CodeEditor
            title="Analisador Sintático Preditivo"
            placeholder="v+v"
            onSubmit={onsubmit}
          />

          <Description>
            <p>
              O seguinte analisador sintático preditivo reconhece a gramática
              LL(1) <em>G1</em> para operações aritméticas de soma e
              multiplicação.
              <br />
              <br />
              E → MF
              <br />
              F → +MF | ε
              <br />
              M → PN
              <br />
              N → xPN | ε
              <br />
              P → (E) | v
              <br />
              <br />
              Utilize o botão compilar para visualizar a árvore sintática da
              sentença no final da página.
            </p>
          </Description>
        </S.Row>
        <Table>
          <thead>
            <TableRow>
              {gramaticaLL1?.terminals.map((n) => (
                <TableHeader key={n}>{n}</TableHeader>
              ))}
              <TableHeader>$</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {analisadorLL1 &&
              analisadorLL1.table &&
              Object.keys(analisadorLL1.table).map((snt) => (
                <TableRow key={snt}>
                  <TableDatacell>{snt}</TableDatacell>
                  {Object.keys(analisadorLL1.table![snt]).map(
                    (st: any, index: number) => (
                      <TableDatacell key={index}>
                        {analisadorLL1.table &&
                        analisadorLL1.table[snt][st] !== null
                          ? (analisadorLL1.table[snt][st] as any).asString
                          : "-"}
                      </TableDatacell>
                    )
                  )}
                </TableRow>
              ))}
          </tbody>
        </Table>
      </S.Container>

      <S.TreeWrapper ref={tree}>
        {arvore && (
          <Tree
            orientation="vertical"
            data={arvore}
            translate={{ x: 600, y: 40 }}
            collapsible={false}
          />
        )}
      </S.TreeWrapper>

      <Toaster />
    </>
  );
};

export default Trabalho5Template;
