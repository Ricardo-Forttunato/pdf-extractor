import { parseHolerite } from "@/lib/parsers/holerite-parser";

test("mapeia statements de visão para holerites com totais e itens", () => {
  const value = parseHolerite([{
    statements: [{
      reference: "01/2020",
      total_proventos: "2.389,77",
      total_descontos: "389,77",
      liquido_receber: "2.000,00",
      itens: [
        { code: "0010", description: "Salário Base", type: "PROVENTO", reference: "220,00", value: "2.389,77" },
        { code: "9001", description: "INSS", type: "DESCONTO", reference: "", value: "389,77" }
      ]
    }]
  }]);

  expect(value.pages[0]).toEqual({
    page: 1,
    month: "01",
    year: "2020",
    reference: "01/2020",
    divergence_calculo: false,
    fields: [
      { code: "0010", label: "Salário Base", reference: "220,00", value: "2.389,77", kind: "PROVENTO" },
      { code: "9001", label: "INSS", reference: "", value: "389,77", kind: "DESCONTO" }
    ],
    bases: [
      { label: "TOTAL PROVENTOS", value: "2.389,77" },
      { label: "TOTAL DESCONTOS", value: "389,77" },
      { label: "LIQUIDO A RECEBER", value: "2.000,00" }
    ]
  });
});

test("marca divergência de cálculo sem derrubar a extração", () => {
  const value = parseHolerite([{
    statements: [{
      reference: "abr-24",
      total_proventos: "1.000,00",
      total_descontos: "200,00",
      liquido_receber: "750,00",
      itens: []
    }]
  }]);

  expect(value.pages[0]).toMatchObject({
    month: "04",
    year: "2024",
    divergence_calculo: true
  });
});
