"use client";

interface Props {
  hasSimulacoes: boolean;
}

export default function Onboarding({ hasSimulacoes }: Props) {
  if (hasSimulacoes) return null;

  return (
    <section className="onboarding-card">
      <div className="onboarding-copy">
        <span className="badge pro">Comece por aqui</span>

        <h2 className="onboarding-title">
          Use o Lucro ML para analisar, decidir e vender com mais clareza
        </h2>

        <p className="onboarding-subtitle">
          Escolha um dos caminhos abaixo para começar sem complicação. O objetivo
          é ajudar você a encontrar oportunidades, entender seu lucro real e tomar
          decisões com mais segurança.
        </p>
      </div>

      <div className="onboarding-steps">
        <div className="onboarding-step">
          <span className="onboarding-step-number">1</span>
          <div>
            <div className="onboarding-step-title">Envie um catálogo ou produto</div>
            <div className="onboarding-step-text">
              Comece analisando um catálogo de fornecedor ou um produto que você quer avaliar.
            </div>
          </div>
        </div>

        <div className="onboarding-step">
          <span className="onboarding-step-number">2</span>
          <div>
            <div className="onboarding-step-title">Veja lucro, risco ou oportunidade</div>
            <div className="onboarding-step-text">
              O sistema mostra margem, leitura de mercado, risco e potencial de venda.
            </div>
          </div>
        </div>

        <div className="onboarding-step">
          <span className="onboarding-step-number">3</span>
          <div>
            <div className="onboarding-step-title">Decida o próximo passo</div>
            <div className="onboarding-step-text">
              Use a análise para ajustar preço, montar kit, simular compra ou validar estoque.
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-footer-copy">
          Comece pela área que faz mais sentido para sua operação hoje.
        </div>
      </div>
    </section>
  );
}

