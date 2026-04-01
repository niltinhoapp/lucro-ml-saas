import type { Strategy } from "@/types/strategy";

export const mockStrategies: Strategy[] = [
  {
    id: "1",
    slug: "preco-ancora",
    title: "Preço Âncora",
    category: "Precificação",
    readTime: "3 min",
    isNew: true,
    isRead: false,
    weekLabel: "Estratégia da Semana",
    accessLevel: "pro",
    summary:
      "Como criar espaço para promoções agressivas sem destruir a sua margem real.",
    content: {
      oQueE:
        "Preço âncora é a técnica de cadastrar um preço base mais alto e manter o anúncio com promoção ativa no valor real que você deseja vender.",
      comoFunciona:
        "Isso ajuda o anúncio a parecer mais competitivo e pode abrir espaço para campanhas sugeridas pelo Mercado Livre sem comprometer o lucro de forma tão agressiva.",
      exemplo:
        "Preço cadastrado: R$119. Promoção ativa: R$89. Em uma campanha, o ML sugere R$87 e devolve parte da taxa. O resultado final pode ficar próximo ou até acima da margem planejada.",
      quandoUsar:
        "Use em produtos com histórico de venda, concorrência forte e margem já mapeada.",
      erroComum:
        "Cadastrar o preço real como preço base e depois não conseguir absorver descontos de campanha.",
      acaoDaSemana:
        "Revise 5 anúncios e identifique quais produtos suportam preço âncora com segurança.",
    },
  },
  {
    id: "2",
    slug: "escada-de-preco",
    title: "Escada de Preço",
    category: "Ranking",
    readTime: "4 min",
    isNew: false,
    isRead: true,
    accessLevel: "pro",
    summary:
      "Pequenas variações de preço para estimular vendas recentes e manter relevância.",
    content: {
      oQueE:
        "Escada de preço é a estratégia de ajustar pequenos degraus no valor promocional do anúncio para manter o produto competitivo e reacender conversão.",
      comoFunciona:
        "Você alterna variações como R$89, R$88 e R$87 conforme o comportamento da demanda e das campanhas.",
      exemplo:
        "Um anúncio parado em R$89 pode ganhar novo impulso em R$87, aumentar vendas recentes e depois sustentar melhor posicionamento ao voltar para R$89.",
      quandoUsar:
        "Use em anúncios com queda de conversão ou em períodos de campanha e maior disputa por tráfego.",
      erroComum:
        "Fazer redução grande demais e transformar a estratégia em perda de margem.",
      acaoDaSemana:
        "Escolha 2 produtos e teste pequenos degraus de preço, monitorando conversão e margem.",
    },
  },
  {
    id: "3",
    slug: "dominio-de-categoria",
    title: "Domínio de Categoria",
    category: "Escala",
    readTime: "5 min",
    isNew: true,
    isRead: false,
    accessLevel: "pro",
    summary:
      "Como ocupar mais espaços na busca com anúncios estrategicamente distribuídos.",
    content: {
      oQueE:
        "Domínio de categoria é a técnica de trabalhar mais de um anúncio para o mesmo produto ou linha, buscando ocupar mais áreas da busca do Mercado Livre.",
      comoFunciona:
        "Você cria anúncios com variações inteligentes de título, proposta, preço, kit ou posicionamento para ampliar presença e reduzir dependência de um único anúncio.",
      exemplo:
        "Mesmo produto com versões: anúncio principal, anúncio promocional, anúncio premium e kit com ticket maior.",
      quandoUsar:
        "Use em produtos campeões de venda, com estoque consistente e categoria competitiva.",
      erroComum:
        "Duplicar anúncio sem estratégia, sem diferenciação de proposta ou sem controle de margem.",
      acaoDaSemana:
        "Mapeie 1 produto principal e desenhe 3 variações de anúncio com objetivos diferentes.",
    },
  },
  {
    id: "4",
    slug: "subsidio-de-campanha",
    title: "Subsídio de Campanha",
    category: "Promoções",
    readTime: "3 min",
    isNew: false,
    isRead: false,
    accessLevel: "pro",
    summary:
      "Entenda quando a devolução de taxa pode proteger sua margem nas campanhas.",
    content: {
      oQueE:
        "Subsídio de campanha é quando o Mercado Livre devolve parte da taxa ou ajuda a compor o desconto promocional.",
      comoFunciona:
        "Ao participar de campanhas específicas, o sistema pode sugerir um preço menor, mas devolver parte da taxa, melhorando a viabilidade da oferta.",
      exemplo:
        "Você vende por R$87 e recebe R$2,80 de devolução. No fim, a conta pode ficar próxima do seu alvo inicial.",
      quandoUsar:
        "Use em produtos com bom giro e margem calculada para absorver variações pequenas.",
      erroComum:
        "Ativar promoção sem recalcular o lucro real com taxa, frete e devolução.",
      acaoDaSemana:
        "Pegue 3 campanhas recentes e compare lucro sem campanha x lucro com devolução.",
    },
  },
];

