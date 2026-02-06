export type UploadResult = {
  id?: string;
  nome?: string; // ✅ adiciona
  message?: string;
  dre?: {
    receitaTotal: number;
    custoProdutos: number;
    taxas: number;
    logistica: number;
    lucro: number;
    margem: number;
  };
};
