export default function DashboardProdutosRadarLoading() {
  return (
    <div className="lm-radar-route">
      <div className="lm-radar-card">
        <div className="lm-radar-card-head">
          <div>
            <div className="lm-loading-line lm-loading-line--sm" />
            <div className="lm-loading-line lm-loading-line--lg" />
          </div>
        </div>

        <div className="lm-loading-grid">
          <div className="lm-loading-box" />
          <div className="lm-loading-box" />
          <div className="lm-loading-box" />
          <div className="lm-loading-box" />
        </div>
      </div>

      <div className="lm-radar-grid-2">
        <div className="lm-radar-section-card">
          <div className="lm-loading-line lm-loading-line--sm" />
          <div className="lm-loading-line" />
          <div className="lm-loading-line" />
        </div>

        <div className="lm-radar-section-card">
          <div className="lm-loading-line lm-loading-line--sm" />
          <div className="lm-loading-line" />
          <div className="lm-loading-line" />
        </div>
      </div>
    </div>
  );
}