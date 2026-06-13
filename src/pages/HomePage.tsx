import { ArrowRight, BadgeCheck, Building2, Check, Code2, DatabaseZap, Gauge, KeyRound, Network, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router';
import { baseUrl, models } from '../data/mock';

const stats = [
  { value: '99.95%', label: '网关可用性' },
  { value: '8+', label: '主流模型接入' },
  { value: '280ms', label: '平均转发延迟' }
];

const featureCards = [
  { icon: <Network size={20} />, title: '统一 API 接入', text: '一套 OpenAI 兼容接口接入多家模型供应商，减少迁移和调试成本。' },
  { icon: <ShieldCheck size={20} />, title: '稳定可靠', text: '多节点转发、状态监控和异常提示，适合团队把 AI 调用接入真实业务。' },
  { icon: <WalletCards size={20} />, title: '透明计费', text: '按调用量查看成本、余额和账单记录，方便个人与企业团队做预算。' }
];

const plans = [
  { name: 'PAYGO', price: '按量付费', badge: '入门', items: ['额度长期有效', '标准模型路由', '用量明细导出'] },
  { name: 'PRO', price: '¥259', badge: '推荐', items: ['更高并发额度', '团队 Key 管理', '低余额预警'] },
  { name: 'MAX', price: '¥559', badge: '企业', items: ['专属转发策略', '企业统一结算', '优先技术支持'] }
];

export function HomePage() {
  const availableModels = models.filter((model) => model.status !== 'maintenance').slice(0, 4);

  return (
    <main className="marketing-page">
      <nav className="marketing-nav" aria-label="官网导航">
        <Link className="marketing-brand" to="/">
          <span className="brand-mark">R</span>
          <strong>RelayHub</strong>
        </Link>
        <div className="marketing-links">
          <a href="#models">模型</a>
          <a href="#pricing">定价</a>
          <a href="#trust">企业适用</a>
          <Link to="/login">登录控制台</Link>
        </div>
      </nav>

      <section className="marketing-hero">
        <div className="hero-copy">
          <span className="eyebrow">一站式多模型 API 网关</span>
          <h1>企业级 AI API 中转站</h1>
          <p>
            面向开发者和团队的稳定 API 转发平台，统一管理模型、密钥、用量和账单，让 AI 应用从本地实验顺畅进入生产环境。
          </p>
          <div className="hero-actions">
            <Link className="button-primary" to="/login">
              免费使用
              <ArrowRight size={16} />
            </Link>
            <a className="button-secondary" href="#pricing">
              查看价格
            </a>
          </div>
          <div className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-console magic-panel" aria-label="API 中转站接入预览">
          <div className="console-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="console-line">
            <span>Base URL</span>
            <code>{baseUrl}</code>
          </div>
          <div className="console-line">
            <span>Authorization</span>
            <code>Bearer rh_live_sk_...</code>
          </div>
          <pre>{`curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $RELAYHUB_KEY" \\
  -d '{"model":"gpt-4.1-mini"}'`}</pre>
        </aside>
      </section>

      <section className="marketing-section">
        <div className="section-title">
          <span className="eyebrow">同时支持</span>
          <h2>主流 AI 编程与模型调用场景</h2>
        </div>
        <div className="logo-strip">
          {['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Codex', 'Claude Code'].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="three-grid">
          {featureCards.map((feature) => (
            <article className="feature-card magic-surface" key={feature.title}>
              <div className="metric-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section split-section" id="models">
        <div>
          <span className="eyebrow">模型路由</span>
          <h2>从轻量任务到复杂推理，统一在一个端点下管理</h2>
          <p>参考 AICodeMirror 的模型能力分层框架，这里把 API 中转站的重点放在供应商接入、状态透明和调用可观测上。</p>
        </div>
        <div className="model-ladder">
          {availableModels.map((model) => (
            <div className="model-step" key={model.id}>
              <span>{model.provider}</span>
              <strong>{model.id}</strong>
              <small>{model.inputPrice} tokens 输入</small>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section split-section">
        <div className="ide-preview">
          <Code2 size={24} />
          <strong>与您的应用和开发工具协同工作</strong>
          <p>在服务端、脚本、CLI、自动化任务或内部平台中直接替换 Base URL，即可接入统一网关。</p>
        </div>
        <div className="integration-list">
          <div>
            <KeyRound size={18} />
            <span>团队 Key 权限管理</span>
          </div>
          <div>
            <Gauge size={18} />
            <span>用量、延迟、错误率看板</span>
          </div>
          <div>
            <DatabaseZap size={18} />
            <span>账单与余额预警</span>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="pricing">
        <div className="section-title">
          <span className="eyebrow">Pricing</span>
          <h2>选择您的接入方案</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className="pricing-card magic-surface" key={plan.name}>
              <span className="plan-badge">{plan.badge}</span>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              {plan.items.map((item) => (
                <p key={item}>
                  <Check size={15} />
                  {item}
                </p>
              ))}
              <Link className="button-secondary" to="/login">
                选择 {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section trust-section" id="trust">
        <div>
          <span className="eyebrow">Enterprise Ready</span>
          <h2>受开发团队信赖</h2>
          <p>适用于需要统一采购、统一账单、统一密钥管理和稳定 API 转发的团队。</p>
        </div>
        <div className="trust-grid">
          {['SaaS 团队', 'AI 应用开发商', '高校实验室', '企业内部工具'].map((item) => (
            <span key={item}>
              <Building2 size={16} />
              {item}
              <BadgeCheck size={16} />
            </span>
          ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <strong>RelayHub</strong>
        <span>© 2026 RelayHub API Gateway</span>
        <Link to="/login">进入控制台</Link>
      </footer>
    </main>
  );
}
