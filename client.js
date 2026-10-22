window.__ModuleLoader__.load({
  id: 'dsh-plugin-agy-quota',
  factory: (require) => {
    const React = require('react');
    const { useState, useEffect, useCallback, createElement: h } = React;

    const CSS_STYLES = `
      .agy-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        color: var(--dsw-alias-label-primary, #ededed);
        font-family: inherit;
        padding-bottom: 32px;
      }

      .agy-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--dsw-alias-border-subtle, rgba(255, 255, 255, 0.1));
        padding-bottom: 16px;
      }

      .agy-title {
        font-size: 1.35rem;
        font-weight: 600;
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--dsw-alias-label-primary, #fff);
      }

      .agy-title-icon {
        color: #38bdf8;
      }

      .agy-subtitle {
        font-size: 0.85rem;
        color: var(--dsw-alias-label-secondary, #9ca3af);
        margin: 0;
      }

      .agy-card {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.04));
        border: 1px solid var(--dsw-alias-border-subtle, rgba(255, 255, 255, 0.08));
        border-radius: var(--dsw-radius-md, 8px);
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .agy-plan-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .agy-plan-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #9ca3af;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .agy-plan-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
      }

      .agy-plan-desc {
        font-size: 0.82rem;
        color: #9ca3af;
        margin-top: 4px;
      }

      .agy-card-title {
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .agy-card-desc {
        font-size: 0.82rem;
        color: var(--dsw-alias-label-secondary, #9ca3af);
        margin-top: -8px;
      }

      .agy-quota-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .agy-metric {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px 14px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.04);
      }

      .agy-metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .agy-metric-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #e5e7eb);
      }

      .agy-metric-values {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .agy-metric-percent {
        font-size: 1.1rem;
        font-weight: 700;
      }

      .agy-metric-reset {
        font-size: 0.78rem;
        color: var(--dsw-alias-label-secondary, #9ca3af);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .agy-bar-track {
        height: 8px;
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }

      .agy-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease, background-color 0.3s ease;
      }

      .agy-fill-high {
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      .agy-fill-mid {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }

      .agy-fill-low {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }

      .agy-metric-desc {
        font-size: 0.78rem;
        color: #9ca3af;
        margin-top: 2px;
      }

      .agy-user-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .agy-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .agy-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.15);
        object-fit: cover;
      }

      .agy-user-details {
        display: flex;
        flex-direction: column;
      }

      .agy-user-name {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #fff);
      }

      .agy-user-email {
        font-size: 0.8rem;
        color: var(--dsw-alias-label-secondary, #9ca3af);
      }

      .agy-badge {
        font-size: 0.72rem;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .agy-badge-local {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      .agy-badge-oauth {
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.3);
      }

      .agy-badge-manual {
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      .agy-btn-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .agy-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        font-size: 0.82rem;
        font-weight: 500;
        border-radius: var(--dsw-radius-sm, 6px);
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        text-decoration: none;
      }

      .agy-btn-primary {
        background: #2563eb;
        color: #fff;
        border-color: #3b82f6;
      }

      .agy-btn-primary:hover {
        background: #1d4ed8;
      }

      .agy-btn-secondary {
        background: var(--dsw-alias-interactive-bg, rgba(255, 255, 255, 0.08));
        color: var(--dsw-alias-label-primary, #e5e7eb);
        border: 1px solid var(--dsw-alias-border-subtle, rgba(255, 255, 255, 0.12));
      }

      .agy-btn-secondary:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.14));
      }

      .agy-btn-danger {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.25);
      }

      .agy-btn-danger:hover {
        background: rgba(239, 68, 68, 0.22);
      }

      .agy-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .agy-spin {
        animation: agy-spin 1s linear infinite;
      }

      @keyframes agy-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .agy-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 0.85rem;
      }

      .agy-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .agy-modal {
        background: var(--dsw-alias-bg-layer-2, #18181b);
        border: 1px solid var(--dsw-alias-border-subtle, rgba(255, 255, 255, 0.15));
        border-radius: var(--dsw-radius-md, 10px);
        width: 440px;
        max-width: 90vw;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      }

      .agy-input {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--dsw-alias-border-subtle, rgba(255, 255, 255, 0.15));
        border-radius: 6px;
        color: #fff;
        padding: 8px 12px;
        font-size: 0.85rem;
        outline: none;
        width: 100%;
        box-sizing: border-box;
      }

      .agy-input:focus {
        border-color: #38bdf8;
      }
    `;

    function injectStylesOnce() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dsh-agy-quota-styles')) return;
      const el = document.createElement('style');
      el.id = 'dsh-agy-quota-styles';
      el.textContent = CSS_STYLES;
      document.head.appendChild(el);
    }

    const IconSparkles = () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z' })
    );

    const IconRefresh = ({ spin }) => h('svg', {
      className: spin ? 'agy-spin' : '',
      width: 15,
      height: 15,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    },
      h('path', { d: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67' })
    );

    const IconClock = () => h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('polyline', { points: '12 6 12 12 16 14' })
    );

    const IconGoogle = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z' })
    );

    function QuotaBar({ bucket, label }) {
      if (!bucket) return null;
      const pct = bucket.percentage ?? 0;
      const fillClass = pct > 50 ? 'agy-fill-high' : pct > 20 ? 'agy-fill-mid' : 'agy-fill-low';
      const colorStyle = pct > 50 ? '#34d399' : pct > 20 ? '#fbbf24' : '#f87171';

      return h('div', { className: 'agy-metric' },
        h('div', { className: 'agy-metric-header' },
          h('span', { className: 'agy-metric-name' }, label || bucket.displayName),
          h('div', { className: 'agy-metric-values' },
            h('span', { className: 'agy-metric-percent', style: { color: colorStyle } }, `${pct}%`),
            bucket.resetFormatted && h('span', { className: 'agy-metric-reset', title: bucket.resetTime ? `Reset at: ${bucket.resetTime}` : '' },
              h(IconClock),
              `Reset: ${bucket.resetFormatted}`
            )
          )
        ),
        h('div', { className: 'agy-bar-track' },
          h('div', {
            className: `agy-bar-fill ${fillClass}`,
            style: { width: `${Math.min(100, Math.max(0, pct))}%` }
          })
        ),
        bucket.description ? h('div', { className: 'agy-metric-desc' }, bucket.description) : null
      );
    }

    function AgyQuotaView() {
      useEffect(() => {
        injectStylesOnce();
      }, []);

      const [loading, setLoading] = useState(true);
      const [refreshing, setRefreshing] = useState(false);
      const [error, setError] = useState(null);
      const [statusData, setStatusData] = useState(null);
      const [showManualModal, setShowManualModal] = useState(false);
      const [manualInput, setManualInput] = useState('');
      const [lastFetchTime, setLastFetchTime] = useState(null);

      const fetchStatus = useCallback(async (force = false) => {
        try {
          if (force) setRefreshing(true);
          setError(null);
          const res = await fetch(`/api/agy-quota/status${force ? '?force=true' : ''}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
          setStatusData(json);
          setLastFetchTime(new Date().toLocaleTimeString());
        } catch (err) {
          setError(err.message || 'Failed to fetch quota data');
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      }, []);

      useEffect(() => {
        fetchStatus(false);
        const interval = setInterval(() => fetchStatus(false), 30000);
        return () => clearInterval(interval);
      }, [fetchStatus]);

      useEffect(() => {
        const handleMessage = (e) => {
          const isAllowedOrigin = !e.origin || e.origin === window.location.origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(e.origin);
          if (!isAllowedOrigin) return;
          if (e.data && e.data.type === 'agy-quota-auth-complete') {
            fetchStatus(true);
          }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
      }, [fetchStatus]);

      const handleAutoDetect = async () => {
        try {
          setRefreshing(true);
          setError(null);
          const res = await fetch('/api/agy-quota/detect', { method: 'POST' });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.message || 'Auto-detection failed');
          setStatusData(json);
          setLastFetchTime(new Date().toLocaleTimeString());
        } catch (err) {
          setError(err.message);
        } finally {
          setRefreshing(false);
        }
      };

      const handleStartOAuth = async () => {
        try {
          setRefreshing(true);
          setError(null);
          const res = await fetch('/api/agy-quota/oauth/start', { method: 'POST' });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.message || 'Failed to start OAuth');
          const width = 600;
          const height = 700;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          const popup = window.open(json.authUrl, 'agy_oauth', `width=${width},height=${height},left=${left},top=${top}`);

          const timer = setInterval(() => {
            if (!popup || popup.closed) {
              clearInterval(timer);
              fetchStatus(true);
            }
          }, 1500);
        } catch (err) {
          setError(err.message);
        } finally {
          setRefreshing(false);
        }
      };

      const handleSaveManualToken = async () => {
        if (!manualInput.trim()) return;
        try {
          setRefreshing(true);
          setError(null);
          const isRefresh = manualInput.includes('1//');
          const payload = isRefresh ? { refreshToken: manualInput.trim() } : { accessToken: manualInput.trim() };
          const res = await fetch('/api/agy-quota/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) throw new Error(json.message || 'Failed to set manual token');
          setStatusData(json);
          setShowManualModal(false);
          setManualInput('');
          setLastFetchTime(new Date().toLocaleTimeString());
        } catch (err) {
          setError(err.message);
        } finally {
          setRefreshing(false);
        }
      };

      const handleLogout = async () => {
        try {
          setRefreshing(true);
          await fetch('/api/agy-quota/logout', { method: 'POST' });
          setStatusData({ ok: false, authenticated: false });
        } catch (err) {
          setError(err.message);
        } finally {
          setRefreshing(false);
        }
      };

      const quota = statusData?.quota;
      const user = statusData?.user;
      const plan = quota?.plan;
      const authenticated = !!statusData?.authenticated;
      const authSource = statusData?.authSource;

      return h('div', { className: 'agy-container' },
        // Header
        h('div', { className: 'agy-header' },
          h('div', null,
            h('h2', { className: 'agy-title' },
              h('span', { className: 'agy-title-icon' }, h(IconSparkles)),
              'Antigravity Quota Monitor'
            ),
            h('p', { className: 'agy-subtitle' },
              'Live Gemini & Claude model quotas from Google Antigravity'
            )
          ),
          h('div', { className: 'agy-btn-group' },
            lastFetchTime && h('span', { style: { fontSize: '0.78rem', color: '#9ca3af', marginRight: 4 } }, `Updated ${lastFetchTime}`),
            h('button', {
              type: 'button',
              className: 'agy-btn agy-btn-secondary',
              onClick: () => fetchStatus(true),
              disabled: refreshing || loading,
            },
              h(IconRefresh, { spin: refreshing }),
              'Refresh'
            )
          )
        ),

        // Error message banner
        error && h('div', { className: 'agy-error' }, error),

        // Plan Card (Matches Antigravity IDE "Plan: Your Plan: Google AI Pro")
        plan && h('div', { className: 'agy-card' },
          h('div', { className: 'agy-plan-row' },
            h('div', null,
              h('div', { className: 'agy-plan-label' }, 'Plan'),
              h('div', { className: 'agy-plan-name' }, `Your Plan: ${plan.tierName || 'Google AI Pro'}`),
              plan.upgradeText && h('div', { className: 'agy-plan-desc' }, plan.upgradeText)
            ),
            (plan.upgradeUri && /^https?:\/\//i.test(plan.upgradeUri)) && h('a', {
              href: plan.upgradeUri,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'agy-btn agy-btn-primary',
            }, 'Upgrade')
          )
        ),

        // Account / Auth Status Row
        h('div', { className: 'agy-card' },
          h('div', { className: 'agy-user-row' },
            h('div', { className: 'agy-user-info' },
              (user?.picture && /^https:\/\//i.test(user.picture))
                ? h('img', { src: user.picture, alt: user.name || 'User', className: 'agy-avatar' })
                : h('div', { className: 'agy-avatar', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' } }, '👤'),
              h('div', { className: 'agy-user-details' },
                h('span', { className: 'agy-user-name' },
                  user?.name || (authenticated ? 'Connected User' : 'Not Connected'),
                  authSource && h('span', {
                    className: `agy-badge ${authSource === 'local-antigravity' ? 'agy-badge-local' : authSource === 'oauth' ? 'agy-badge-oauth' : 'agy-badge-manual'}`,
                    style: { marginLeft: 8 }
                  }, authSource === 'local-antigravity' ? 'Antigravity IDE' : authSource === 'oauth' ? 'Google OAuth' : 'Manual Token')
                ),
                h('span', { className: 'agy-user-email' }, user?.email || (authenticated ? 'Token active' : 'Sign in to view quotas'))
              )
            ),
            h('div', { className: 'agy-btn-group' },
              h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-secondary',
                onClick: handleAutoDetect,
                disabled: refreshing,
                title: 'Detect credentials from installed Antigravity IDE SQLite state',
              }, 'Auto-Detect IDE'),
              h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-primary',
                onClick: handleStartOAuth,
                disabled: refreshing,
                title: 'Sign in with Google OAuth',
              },
                h(IconGoogle),
                'Google Login'
              ),
              h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-secondary',
                onClick: () => setShowManualModal(true),
                title: 'Enter Refresh Token or Access Token manually',
              }, 'Manual Token'),
              authenticated && h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-danger',
                onClick: handleLogout,
              }, 'Disconnect')
            )
          )
        ),

        // Gemini Model Quota Card (Weekly & 5-hour)
        h('div', { className: 'agy-card' },
          h('div', { className: 'agy-card-title' },
            h('span', null, 'Gemini Models'),
            h('span', { style: { fontSize: '0.8rem', color: '#38bdf8', fontWeight: 500 } }, 'Gemini Flash, Gemini Pro')
          ),
          h('div', { className: 'agy-card-desc' },
            'Shared usage quota pool for all Antigravity Gemini models'
          ),
          loading ? h('div', { style: { padding: '20px 0', textAlign: 'center', color: '#9ca3af' } }, 'Loading quota...')
            : !authenticated ? h('div', { style: { padding: '16px 0', textAlign: 'center', color: '#9ca3af' } }, 'Authenticate via Auto-Detect or Google Login to load Gemini quota.')
              : h('div', { className: 'agy-quota-group' },
                h(QuotaBar, { bucket: quota?.gemini?.weekly, label: 'Weekly Limit Remaining' }),
                h(QuotaBar, { bucket: quota?.gemini?.fiveHour, label: 'Five Hour Limit Remaining' })
              )
        ),

        // Claude & 3P Quota Card
        quota?.claude3p && h('div', { className: 'agy-card' },
          h('div', { className: 'agy-card-title' },
            h('span', null, 'Claude and GPT models'),
            h('span', { style: { fontSize: '0.8rem', color: '#fb923c', fontWeight: 500 } }, 'Claude Opus, Claude Sonnet, GPT')
          ),
          h('div', { className: 'agy-card-desc' },
            'Shared quota pool for external models in Antigravity'
          ),
          h('div', { className: 'agy-quota-group' },
            quota.claude3p.weekly && h(QuotaBar, { bucket: quota.claude3p.weekly, label: 'Weekly Limit Remaining' }),
            quota.claude3p.fiveHour && h(QuotaBar, { bucket: quota.claude3p.fiveHour, label: 'Five Hour Limit Remaining' })
          )
        ),

        // Manual Token Modal
        showManualModal && h('div', { className: 'agy-modal-backdrop', onClick: () => setShowManualModal(false) },
          h('div', { className: 'agy-modal', onClick: (e) => e.stopPropagation() },
            h('h3', { style: { margin: 0, fontSize: '1.1rem', color: '#fff' } }, 'Manual Token Configuration'),
            h('p', { style: { margin: 0, fontSize: '0.82rem', color: '#9ca3af' } },
              'Paste a Google OAuth Refresh Token (starting with 1//) or an active Access Token (starting with ya29).'
            ),
            h('input', {
              className: 'agy-input',
              type: 'text',
              placeholder: '1//... or ya29....',
              value: manualInput,
              onChange: (e) => setManualInput(e.target.value),
            }),
            h('div', { className: 'agy-btn-group', style: { justifyContent: 'flex-end', marginTop: 8 } },
              h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-secondary',
                onClick: () => setShowManualModal(false),
              }, 'Cancel'),
              h('button', {
                type: 'button',
                className: 'agy-btn agy-btn-primary',
                onClick: handleSaveManualToken,
                disabled: !manualInput.trim(),
              }, 'Save & Connect')
            )
          )
        )
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'agy-quota',
          order: 115,
          label: () => 'agy-quota',
        }, AgyQuotaView));
      },
    };
  },
});
