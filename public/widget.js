(function() {
  const WIDGET_ID = 'ai-job-spot-widget';
  const API_URL = 'https://aijobspot.online/api/public/jobs';

  function init() {
    const container = document.getElementById(WIDGET_ID);
    if (!container) return;

    // Read configuration from data attributes
    const limit = container.getAttribute('data-limit') || 5;
    const tag = container.getAttribute('data-tag') || '';
    const theme = container.getAttribute('data-theme') || 'light';

    // Build API URL
    const url = new URL(API_URL);
    url.searchParams.append('limit', limit);
    if (tag) url.searchParams.append('tag', tag);

    fetch(url)
      .then(response => response.json())
      .then(data => renderWidget(container, data, theme))
      .catch(err => console.error('AI Job Spot Widget Error:', err));
  }

  function renderWidget(container, data, theme) {
    const styles = `
      .ajs-widget {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        overflow: hidden;
        background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
        color: ${theme === 'dark' ? '#f3f4f6' : '#111827'};
        width: 100%;
        max-width: 400px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .ajs-header {
        background: #1A2B4C; /* Brand Navy */
        color: #ffffff;
        padding: 12px 16px;
        font-family: "Playfair Display", Georgia, serif; /* Brand Serif */
        font-weight: 600;
        font-size: 16px;
        letter-spacing: 0.025em;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #D4AF37; /* Brand Gold Accent */
      }
      .ajs-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .ajs-item {
        border-bottom: 1px solid ${theme === 'dark' ? '#374151' : '#f3f4f6'};
        padding: 12px 16px;
        transition: background 0.2s;
      }
      .ajs-item:last-child {
        border-bottom: none;
      }
      .ajs-item:hover {
        background: ${theme === 'dark' ? '#374151' : '#fafafa'};
      }
      .ajs-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .ajs-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        color: ${theme === 'dark' ? '#9ca3af' : '#1A2B4C'};
        transition: color 0.2s;
      }
      .ajs-item:hover .ajs-title {
        color: ${theme === 'dark' ? '#D4AF37' : '#D4AF37'}; /* Gold on hover */
      }
      .ajs-meta {
        font-size: 12px;
        color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
        display: flex;
        justify-content: space-between;
      }
      .ajs-footer {
        padding: 8px 16px;
        background: ${theme === 'dark' ? '#111827' : '#f9fafb'};
        font-size: 11px;
        text-align: center;
        border-top: 1px solid ${theme === 'dark' ? '#374151' : '#e5e5e5'};
        font-family: "Playfair Display", Georgia, serif;
      }
      .ajs-footer a {
        color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
        text-decoration: none;
        font-weight: 600;
      }
      .ajs-footer a:hover {
        color: #D4AF37;
        text-decoration: none;
      }
    `;

    const jobsHtml = data.jobs.map(job => `
      <li class="ajs-item">
        <a href="${job.url}" target="_blank" class="ajs-link">
          <div class="ajs-title">${escapeHtml(job.title)}</div>
          <div class="ajs-meta">
            <span>${escapeHtml(job.company)}</span>
            <span>${escapeHtml(job.location.split(',')[0])}</span>
          </div>
        </a>
      </li>
    `).join('');

    container.innerHTML = `
      <style>${styles}</style>
      <div class="ajs-widget">
        <div class="ajs-header">
          <span>AI Jobs</span>
        </div>
        <ul class="ajs-list">
          ${jobsHtml}
        </ul>
        <div class="ajs-footer">
          Powered by <a href="https://aijobspot.online?ref=widget_footer" target="_blank">AI Job Spot</a>
        </div>
      </div>
    `;
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
