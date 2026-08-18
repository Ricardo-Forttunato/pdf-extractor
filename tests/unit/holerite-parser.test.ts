import { parseHolerite } from "@/lib/parsers/holerite-parser";
test("separa verbas de bases", () => {
  const page = parseHolerite(["Competência 01/2020\n0010 Salário Base 220,00 2.389,77\nBase INSS 2.545,68\nValor Líquido 2.000,00"]).pages[0]!;
  expect(page.fields).toEqual([{ code: "0010", label: "Salário Base", reference: "220,00", value: "2.389,77" }]);
  expect(page.bases.map((base) => base.label)).toEqual(["Base INSS", "Valor Líquido"]);
});

test("separa tabela principal de bases em layout multi-coluna e continua entre páginas físicas", () => {
  const value = parseHolerite([
    [
      "Folha Normal",
      "Mês: jan-18",
      "REMUNERAÇÃOMES 1.567,25 290 VA Funcionario 0 96,14 BASEDECALCULODOINSS 2.078,61",
      "91 Hr Adic Pericul 220,00 470,18 511 INSS Normal 0 187,07 SALARIOLIQUIDONOMES 598,42"
    ].join("\n"),
    [
      "TOT.RENDIMENTOS 2.078,61 561 IRF Normal 0 0,00 VALORDOIRFARECOLHER 0,00",
      "820 Vale Transp Fun 44 94,04 TOTALDESCONTOS 1.480,19",
      "Folha Normal",
      "Mês: fev-18",
      "311 Part Lucr Resul 0,00 458,42 313 IRF Part Result 0 0,00 SALARIOLIQUIDONOMES 458,42",
      "TOT.RENDIMENTOS 458,42 TOTALDESCONTOS 0,00"
    ].join("\n")
  ]);

  expect(value.pages).toHaveLength(2);
  expect(value.pages[0]).toMatchObject({
    page: 1,
    month: "01",
    year: "2018",
    fields: [
      { code: "290", label: "VA Funcionario", reference: "0", value: "96,14" },
      { code: "91", label: "Hr Adic Pericul", reference: "220,00", value: "470,18" },
      { code: "511", label: "INSS Normal", reference: "0", value: "187,07" },
      { code: "561", label: "IRF Normal", reference: "0", value: "0,00" },
      { code: "820", label: "Vale Transp Fun", reference: "44", value: "94,04" }
    ]
  });
  expect(value.pages[0]?.bases).toEqual([
    { label: "REMUNERACAO MES", value: "1.567,25" },
    { label: "BASE DE CALCULO DO INSS", value: "2.078,61" },
    { label: "SALARIO LIQUIDO NO MES", value: "598,42" },
    { label: "TOTAL RENDIMENTOS", value: "2.078,61" },
    { label: "VALOR DO IRF A RECOLHER", value: "0,00" },
    { label: "TOTAL DESCONTOS", value: "1.480,19" }
  ]);
  expect(value.pages[1]).toMatchObject({
    page: 2,
    month: "02",
    year: "2018",
    fields: [
      { code: "311", label: "Part Lucr Resul", reference: "0,00", value: "458,42" },
      { code: "313", label: "IRF Part Result", reference: "0", value: "0,00" }
    ],
    bases: [
      { label: "SALARIO LIQUIDO NO MES", value: "458,42" },
      { label: "TOTAL RENDIMENTOS", value: "458,42" },
      { label: "TOTAL DESCONTOS", value: "0,00" }
    ]
  });
});
