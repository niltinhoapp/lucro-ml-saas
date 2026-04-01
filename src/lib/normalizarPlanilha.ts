// src/lib/normalizarPlanilha.ts
import type { LinhaVenda } from "@/lib/dre/calcularDre";

function normKey(s: string) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWord(nh: string, w: string) {
  const re = new RegExp(`(^|\\s)${escapeRegExp(w)}(\\s|$)`);
  return re.test(nh);
}

function parseNumberSmart(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  // remove moeda e espaços
  s = s.replace(/[R$\s]/g, "");

  // negativo "(123,45)"
  const parenNeg = /^\((.*)\)$/.exec(s);
  if (parenNeg) s = `-${parenNeg[1]}`;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // decide qual é decimal pelo último separador
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    const decimalIsComma = lastComma > lastDot;

    if (decimalIsComma) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * ✅ Sinônimos com prioridade:
 * - Para planilhas "collection/export" do Mercado Pago:
 *   preferir "valor total recebido" / "valor recebido" / "net received".
 */
const COLS = {
  data: [
    "data",
    "date",
    "date_created",
    "date_approved",
    "date_released",
    "data aprovacao",
    "data de aprovacao",
  ],

  produto: [
    "descricao",
    "descrição",
    "reason",
    "produto",
    "item",
    "titulo",
    "título",
    "anuncio",
    "anúncio",
    "item_id",
    "id do item",
  ],

  // ⚠️ receita (priorize líquido recebido)
  receita: [
    "valor total recebido",
    "valor recebido",
    "valor liquido",
    "valor líquido",
    "net_received_amount",
    "net received amount",
    "net_amount",
    "net amount",

    // fallback (mais “bruto”)
    "receita",
    "venda",
    "valor venda",
    "valor da venda",
    "valor do produto",
    "transaction_amount",
    "valor total",
    "total",
    "faturamento",
  ],

  // custo do produto (normalmente não existe no collection)
  custo: [
    "custo do produto",
    "custo produto",
    "cmv",
    "custo mercadoria",
    "cogs",
    "cost",
    "custo",
  ],

  // taxas (inclui parcelamento)
  taxa: [
    "mercadopago_fee",
    "marketplace_fee",
    "financing_fee",
    "custos de parcelamento",
    "parcelamento",
    "fee_amount",
    "fee amount",
    "taxa",
    "taxas",
    "tarifa",
    "tarifas",
    "tarifa mp",
    "tarifa mercado pago",
    "comissao",
    "comissão",
    "comissao ml",
    "comissão ml",
    "fees",
    "fee",
  ],

  logistica: [
    "shipping_cost",
    "shipping_amount",
    "shipping amount",
    "frete",
    "envio",
    "custo envio",
    "custo do envio",
    "logistica",
    "logística",
    "shipping",
    "delivery",
  ],

  // (opcional) descontos/estornos que às vezes existem separadamente
  descontos: [
    "discount",
    "discounts",
    "desconto",
    "descontos",
    "chargeback",
    "estorno",
    "reembolso",
    "refund",
    "refunded_amount",
    "refunded amount",
  ],
} as const;

type Canon = keyof typeof COLS;

function findHeaderKey(headers: string[], campo: Canon, used: Set<string>) {
  const wanted = COLS[campo].map(normKey);

  for (const w of wanted) {
    // 1) match exato
    for (const h of headers) {
      if (used.has(h)) continue;
      const nh = normKey(h);
      if (nh === w) return h;
    }

    // 2) match por palavra/frase com borda
    for (const h of headers) {
      if (used.has(h)) continue;
      const nh = normKey(h);
      if (hasWord(nh, w)) return h;
    }
  }

  return null;
}

function isLikelyNonDataRow(obj: Record<string, any>) {
  // evita linha “total geral”, “resumo”, cabeçalho repetido no meio, etc.
  const all = Object.values(obj ?? {}).map((v) => String(v ?? "").trim());
  if (!all.some((x) => x !== "")) return true;

  const joined = all.join(" ").toLowerCase();
  if (joined.includes("total geral")) return true;
  if (joined.includes("subtotal")) return true;
  if (joined.includes("resumo")) return true;

  return false;
}

export function normalizarPlanilha(rows: Record<string, any>[]) {
  const first = rows?.[0] ?? {};
  const headers = Object.keys(first);

  const camposDetectados: Partial<Record<Canon, string>> = {};
  const used = new Set<string>();

  // ordem para evitar conflito: receita/taxa/logística primeiro
  const order: Canon[] = ["receita", "taxa", "logistica", "descontos", "custo", "data", "produto"];

  for (const campo of order) {
    const found = findHeaderKey(headers, campo, used);
    if (found) {
      camposDetectados[campo] = found;
      used.add(found);
    }
  }

  const camposIgnorados = headers.filter((h) => !used.has(h));

  // helper de leitura por campo
  const getField = (r: Record<string, any>, campo: Canon) => {
    const key = camposDetectados[campo];
    return key ? r[key] : undefined;
  };

  const linhas: LinhaVenda[] = (rows || [])
    .filter((r) => !isLikelyNonDataRow(r))
    .map((r) => {
      // ✅ receita (pode ser líquido ou bruto)
      let receita = parseNumberSmart(getField(r, "receita"));

      // ✅ despesas (padroniza positivo)
      const taxa = Math.abs(parseNumberSmart(getField(r, "taxa")));
      const logistica = Math.abs(parseNumberSmart(getField(r, "logistica")));
      const custo = Math.abs(parseNumberSmart(getField(r, "custo")));

      // ✅ descontos/estornos: normalmente vêm negativos, mas podem vir positivos
      const descontos = Math.abs(parseNumberSmart(getField(r, "descontos")));

      // Se a receita escolhida for “bruta” e existir coluna de descontos/estornos,
      // faz um ajuste simples para aproximar do líquido:
      // (isso só ajuda quando o export separa desconto/reembolso, e a “receita” é bruto)
      if (receita > 0 && descontos > 0) {
        // Não é perfeito, mas evita receitas infladas em alguns modelos
        receita = Math.max(0, receita - descontos);
      }

      return {
        data: String(getField(r, "data") ?? "").trim() || "",
        produto: String(getField(r, "produto") ?? "").trim() || "",
        receita,
        custo,
        taxa,
        logistica,
      };
    });

  return { linhas, camposDetectados, camposIgnorados, headers };
}

