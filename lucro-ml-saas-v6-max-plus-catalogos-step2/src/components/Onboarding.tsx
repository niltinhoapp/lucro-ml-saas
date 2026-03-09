"use client";

interface Props {
  hasSimulacoes: boolean;
}

export default function Onboarding({ hasSimulacoes }: Props) {
  if (hasSimulacoes) return null;

  return (
    <section className="onboarding-card">
      <div className="onboarding-copy">
        <span className="badge pro">Primeiros passos</span>

        <h2 className="onboarding-title">
          Descubra o lucro real dos seus produtos
        </h2>

        <p className="onboarding-subtitle">
          Importe sua planilha, gere o DRE e veja rapidamente onde sua margem
          está boa, apertada ou negativa.
        </p>
      </div>

      <div className="onboarding-steps">
        <div className="onboarding-step">
          <span className="onboarding-step-number">1</span>
          <div>
            <div className="onboarding-step-title">Importe a planilha</div>
            <div className="onboarding-step-text">
              Use seus dados do Mercado Livre para começar.
            </div>
          </div>
        </div>

        <div className="onboarding-step">
          <span className="onboarding-step-number">2</span>
          <div>
            <div className="onboarding-step-title">Veja o DRE automático</div>
            <div className="onboarding-step-text">
              Receita, taxas, logística, custos e lucro em uma leitura só.
            </div>
          </div>
        </div>

        <div className="onboarding-step">
          <span className="onboarding-step-number">3</span>
          <div>
            <div className="onboarding-step-title">Compare Full vs Flex</div>
            <div className="onboarding-step-text">
              Entenda qual modelo protege melhor sua margem.
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-footer-copy">
          Envie sua planilha e gere sua primeira análise agora.
        </div>
      </div>
    </section>
  );
}