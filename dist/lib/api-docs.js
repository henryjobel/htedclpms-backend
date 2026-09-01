"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiModules = void 0;
exports.getApiCatalog = getApiCatalog;
exports.renderApiDocsHtml = renderApiDocsHtml;
exports.apiModules = [
    {
        name: "Auth & Identity",
        basePath: "/api/auth",
        description: "User authentication, JWT issuing, registration, profile retrieval, and password management.",
        endpoints: [
            { method: "POST", path: "/login", auth: false, title: "Login & Get JWT Token", description: "Authenticates with email/password and returns a bearer token." },
            { method: "POST", path: "/register", auth: false, title: "Register New User", description: "Creates a new user account with specified role." },
            { method: "GET", path: "/me", title: "Current Authenticated User", description: "Returns current user details and permissions." },
            { method: "POST", path: "/change-password", title: "Change Password", description: "Updates user account password." },
        ],
    },
    {
        name: "Projects & Engineering",
        basePath: "/api/projects",
        description: "Complete construction project lifecycle: BOQ items, tasks, milestone progress, quotations, and work orders.",
        endpoints: [
            { method: "GET", path: "/", title: "Get All Projects", description: "List all construction projects with filters." },
            { method: "POST", path: "/", title: "Create Project", description: "Add a new construction project." },
            { method: "GET", path: "/:id", title: "Get Project Details", description: "Detailed information for a single project." },
            { method: "PUT", path: "/:id", title: "Update Project", description: "Update project metadata, status, or timeline." },
            { method: "DELETE", path: "/:id", title: "Delete Project", description: "Remove a project from the system." },
            { method: "GET", path: "/:id/boq", title: "Get Project BOQ", description: "Bill of quantities for materials and work." },
            { method: "POST", path: "/:id/boq", title: "Add BOQ Item", description: "Add a new estimated line item to project BOQ." },
            { method: "PUT", path: "/boq/:itemId", title: "Update BOQ Item", description: "Update cost, quantity, or description of BOQ item." },
            { method: "DELETE", path: "/boq/:itemId", title: "Delete BOQ Item", description: "Remove a BOQ item." },
            { method: "GET", path: "/:id/tasks", title: "List Project Tasks", description: "Get tasks assigned to a project." },
            { method: "POST", path: "/:id/tasks", title: "Create Project Task", description: "Assign task with dates and assignee." },
            { method: "PATCH", path: "/:id/tasks/:taskId", title: "Update Task Progress", description: "Modify task status and completion percentage." },
            { method: "DELETE", path: "/:id/tasks/:taskId", title: "Delete Task", description: "Remove task from project." },
            { method: "GET", path: "/:id/progress", title: "Get Progress Logs", description: "Timeline logs of site progress." },
            { method: "POST", path: "/:id/progress", title: "Log Project Progress", description: "Submit daily or milestone progress update." },
            { method: "DELETE", path: "/:id/progress/:logId", title: "Delete Progress Log", description: "Remove a progress log entry." },
            { method: "GET", path: "/quotations/all", title: "List Quotations", description: "All client and vendor quotations." },
            { method: "POST", path: "/quotations", title: "Create Quotation", description: "Generate a new formal quotation." },
            { method: "PUT", path: "/quotations/:id", title: "Update Quotation", description: "Update quotation items and prices." },
            { method: "DELETE", path: "/quotations/:id", title: "Delete Quotation", description: "Delete quotation." },
            { method: "GET", path: "/work-orders/all", title: "List Work Orders", description: "All assigned work orders." },
            { method: "POST", path: "/work-orders", title: "Create Work Order", description: "Issue new work order to contractor." },
            { method: "PUT", path: "/work-orders/:id", title: "Update Work Order", description: "Update work order terms." },
            { method: "DELETE", path: "/work-orders/:id", title: "Delete Work Order", description: "Cancel work order." },
        ],
    },
    {
        name: "Inventory & Supply Chain",
        basePath: "/api/inventory",
        description: "Material management, suppliers, requisitions, RFQs, purchase orders, GRN receipts, and stock adjustments.",
        endpoints: [
            { method: "GET", path: "/products", title: "List Inventory Products", description: "Get current stock levels, SKUs, and categories." },
            { method: "POST", path: "/products", title: "Create Product", description: "Register new material or item in inventory." },
            { method: "PUT", path: "/products/:id", title: "Update Product", description: "Update product price, minimum stock, or description." },
            { method: "POST", path: "/products/:id/adjustment", title: "Stock Adjustment", description: "Manual increase or decrease in stock." },
            { method: "DELETE", path: "/products/:id", title: "Delete Product", description: "Remove product from inventory." },
            { method: "GET", path: "/suppliers", title: "List Suppliers", description: "Supplier directory and contact records." },
            { method: "POST", path: "/suppliers", title: "Create Supplier", description: "Add new vendor or material supplier." },
            { method: "GET", path: "/requisitions", title: "List Requisitions", description: "Site material requisition requests." },
            { method: "POST", path: "/requisitions", title: "Create Requisition", description: "Site engineer material request submission." },
            { method: "PATCH", path: "/requisitions/:id/status", title: "Update Requisition Status", description: "Approve, reject, or process requisition." },
            { method: "DELETE", path: "/requisitions/:id", title: "Delete Requisition", description: "Remove requisition entry." },
            { method: "GET", path: "/rfqs", title: "List RFQs", description: "Request for quotations sent to vendors." },
            { method: "POST", path: "/rfqs", title: "Create RFQ", description: "Send RFQ to suppliers." },
            { method: "PUT", path: "/rfqs/:id", title: "Update RFQ", description: "Update vendor price bids in RFQ." },
            { method: "GET", path: "/rfqs/comparison", title: "RFQ Bid Comparison", description: "Compare supplier prices side-by-side." },
            { method: "PATCH", path: "/rfqs/:id/select", title: "Select Winning Bid", description: "Choose winning vendor from RFQ." },
            { method: "DELETE", path: "/rfqs/:id", title: "Delete RFQ", description: "Cancel RFQ." },
            { method: "GET", path: "/purchase-orders", title: "List Purchase Orders", description: "Issued POs with delivery tracking." },
            { method: "POST", path: "/purchase-orders", title: "Create Purchase Order", description: "Generate formal purchase order." },
            { method: "PATCH", path: "/purchase-orders/:id/status", title: "Update PO Status", description: "Set status to delivered, pending, etc." },
            { method: "DELETE", path: "/purchase-orders/:id", title: "Delete Purchase Order", description: "Cancel PO." },
            { method: "GET", path: "/grns", title: "List GRNs", description: "Goods Received Notes upon site delivery." },
            { method: "POST", path: "/grns", title: "Create GRN", description: "Acknowledge material delivery and increase stock." },
            { method: "DELETE", path: "/grns/:id", title: "Delete GRN", description: "Remove GRN." },
            { method: "GET", path: "/adjustments", title: "List Stock Adjustments", description: "Audit trail of all inventory alterations." },
            { method: "DELETE", path: "/adjustments/:id", title: "Delete Adjustment", description: "Remove adjustment entry." },
        ],
    },
    {
        name: "Finance & Accounts",
        basePath: "/api/accounts",
        description: "Double-entry bookkeeping, Chart of Accounts, Vouchers, Ledger, Installments, Bank/Cash, and Financial Statements.",
        endpoints: [
            { method: "GET", path: "/chart", title: "Chart of Accounts", description: "Hierarchical ledger tree." },
            { method: "POST", path: "/chart", title: "Create Ledger Account", description: "Add asset, liability, equity, revenue, or expense." },
            { method: "PUT", path: "/chart/:id", title: "Update Ledger Account", description: "Edit account name, code, or parent." },
            { method: "DELETE", path: "/chart/:id", title: "Delete Ledger Account", description: "Delete inactive account." },
            { method: "GET", path: "/vouchers", title: "List Vouchers", description: "Debit, credit, journal, and contra vouchers." },
            { method: "POST", path: "/vouchers", title: "Create Voucher", description: "Create financial transaction voucher." },
            { method: "PATCH", path: "/vouchers/:id/approve", title: "Approve Voucher", description: "Post voucher to general ledger." },
            { method: "DELETE", path: "/vouchers/:id", title: "Delete Voucher", description: "Cancel or remove draft voucher." },
            { method: "GET", path: "/ledger", title: "General Ledger Report", description: "Debits, credits, and running balance by account." },
            { method: "GET", path: "/installments", title: "Installment Schedules", description: "Customer unit payment milestones." },
            { method: "POST", path: "/installments", title: "Create Installment", description: "Create custom installment schedule." },
            { method: "POST", path: "/installments/:id/pay", title: "Record Installment Payment", description: "Process customer payment against installment." },
            { method: "DELETE", path: "/installments/:id", title: "Delete Installment", description: "Delete installment entry." },
            { method: "GET", path: "/bank-accounts", title: "Bank & Cash Accounts", description: "List connected bank accounts and cash registers." },
            { method: "POST", path: "/bank-accounts", title: "Create Bank Account", description: "Register new bank or petty cash account." },
            { method: "POST", path: "/bank-transactions", title: "Bank Transaction", description: "Record direct bank deposit or withdrawal." },
            { method: "GET", path: "/cash-book", title: "Cash Book Report", description: "Daily inflows and outflows in cash." },
            { method: "GET", path: "/bank-reconciliations", title: "Bank Reconciliations", description: "Bank statement vs book balance checks." },
            { method: "GET", path: "/cheques", title: "Cheque Management", description: "Track issued and received cheques." },
            { method: "GET", path: "/profit-loss", title: "Profit & Loss Statement", description: "Revenue vs expenditure calculation." },
            { method: "GET", path: "/balance-sheet", title: "Balance Sheet", description: "Assets, liabilities, and equity overview." },
            { method: "GET", path: "/cash-flow", title: "Cash Flow Statement", description: "Operating, investing, and financing cash flows." },
            { method: "GET", path: "/trial-balance", title: "Trial Balance", description: "Debit/Credit equality verification." },
            { method: "GET", path: "/day-book", title: "Day Book", description: "Chronological transaction diary." },
            { method: "GET", path: "/dashboard-summary", title: "Executive Financial Summary", description: "Key financial metrics for dashboard." },
        ],
    },
    {
        name: "Contractors & Workforce",
        basePath: "/api",
        description: "Labor workforce management, contractor agreements, work assignments, and daily attendance logs.",
        endpoints: [
            { method: "GET", path: "/contractors", title: "List Contractors", description: "Contractor directory and trade specializations." },
            { method: "POST", path: "/contractors", title: "Create Contractor", description: "Add new contractor profile." },
            { method: "PUT", path: "/contractors/:id", title: "Update Contractor", description: "Edit contractor rates and details." },
            { method: "POST", path: "/contractors/:id/assign", title: "Assign to Project", description: "Assign contractor to project milestone." },
            { method: "POST", path: "/contractors/assignments/:id/pay", title: "Pay Contractor", description: "Issue payment against contract assignment." },
            { method: "DELETE", path: "/contractors/:id", title: "Delete Contractor", description: "Deactivate contractor profile." },
            { method: "GET", path: "/workers", title: "List Site Workers", description: "Daily wage and skilled site labor records." },
            { method: "POST", path: "/workers", title: "Create Worker", description: "Register new site worker." },
            { method: "PUT", path: "/workers/:id", title: "Update Worker", description: "Edit worker information." },
            { method: "POST", path: "/workers/:id/attendance", title: "Worker Attendance", description: "Log daily clock-in / clock-out." },
            { method: "DELETE", path: "/workers/:id", title: "Delete Worker", description: "Deactivate worker." },
        ],
    },
    {
        name: "Real Estate & Units",
        basePath: "/api/real-estate",
        description: "Real estate property management: blocks, roads, individual units, customer bookings, and installment sales.",
        endpoints: [
            { method: "GET", path: "/summary", title: "Real Estate Overview", description: "Inventory metrics, sold units, and collections." },
            { method: "GET", path: "/blocks", title: "List Blocks/Buildings", description: "All property sectors and buildings." },
            { method: "POST", path: "/blocks", title: "Create Block", description: "Add new building or land block." },
            { method: "GET", path: "/roads", title: "List Roads", description: "Property access roads." },
            { method: "POST", path: "/roads", title: "Create Road", description: "Add new road record." },
            { method: "GET", path: "/units", title: "List Units / Flats / Plots", description: "All saleable units with status." },
            { method: "POST", path: "/units", title: "Create Unit", description: "Add new apartment, shop, or plot." },
            { method: "PUT", path: "/units/:id", title: "Update Unit", description: "Edit unit price, size, or features." },
            { method: "DELETE", path: "/units/:id", title: "Delete Unit", description: "Remove unit record." },
            { method: "GET", path: "/bookings", title: "List Bookings", description: "Customer preliminary reservations." },
            { method: "POST", path: "/bookings", title: "Create Booking", description: "Reserve a unit with booking token." },
            { method: "POST", path: "/bookings/:id/cancel", title: "Cancel Booking", description: "Cancel reservation and release unit." },
            { method: "GET", path: "/sales", title: "List Confirmed Sales", description: "Deed confirmed property sales." },
            { method: "POST", path: "/sales", title: "Create Sale", description: "Convert booking to confirmed unit sale." },
            { method: "POST", path: "/sales/:id/installment-plan", title: "Generate Payment Plan", description: "Auto-generate installment schedule." },
        ],
    },
    {
        name: "Design & Approvals",
        basePath: "/api/design",
        description: "Architectural drawings, structural engineering reviews, consultant fee tracking, and municipal approvals.",
        endpoints: [
            { method: "GET", path: "/consultants", title: "List Consultants", description: "Architects, structural engineers, and planners." },
            { method: "POST", path: "/consultants", title: "Create Consultant", description: "Register new design consultant." },
            { method: "GET", path: "/records", title: "Design Records", description: "Drawing submissions and approval tracking." },
            { method: "POST", path: "/records", title: "Create Design Record", description: "Log new drawing submission." },
            { method: "PUT", path: "/records/:id", title: "Update Design Record", description: "Update revision status or approval." },
        ],
    },
    {
        name: "System, Roles & Admin",
        basePath: "/api",
        description: "User management, role-based access control (RBAC), system settings, master data, and audit activity logs.",
        endpoints: [
            { method: "GET", path: "/users", title: "List System Users", description: "All administrators, managers, and staff." },
            { method: "POST", path: "/users", title: "Create User", description: "Create staff user account." },
            { method: "PUT", path: "/users/:id", title: "Update User", description: "Update user profile or role." },
            { method: "PATCH", path: "/users/:id/status", title: "Toggle Active Status", description: "Enable or disable user login." },
            { method: "GET", path: "/admin/roles", title: "List Roles", description: "Defined security roles and permission sets." },
            { method: "POST", path: "/admin/roles", title: "Create Custom Role", description: "Define custom role with granular permissions." },
            { method: "GET", path: "/admin/permissions/catalog", title: "Permission Catalog", description: "All available system permissions." },
            { method: "GET", path: "/admin/activity", title: "System Activity Logs", description: "Audit trail of logins and critical changes." },
            { method: "GET", path: "/settings/system", title: "Get System Settings", description: "Company branding, currency, and defaults." },
            { method: "PUT", path: "/settings/system", title: "Save System Settings", description: "Update system-wide preferences." },
        ],
    },
];
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }[char] ?? char));
}
function getApiCatalog() {
    const totalEndpoints = exports.apiModules.reduce((sum, module) => sum + module.endpoints.length, 0);
    return {
        service: "HET PMS Backend API",
        version: "1.0.0",
        status: "online",
        healthEndpoint: "/health",
        totalModules: exports.apiModules.length,
        totalEndpoints,
        auth: {
            type: "Bearer JWT",
            loginUrl: "/api/auth/login",
            header: "Authorization: Bearer <token>",
            defaultCredentials: {
                email: "superadmin@hetpms.com",
                password: "admin@123",
            },
        },
        modules: exports.apiModules,
    };
}
function renderApiDocsHtml(baseUrl) {
    const catalog = getApiCatalog();
    const dbConfigured = Boolean(process.env.DATABASE_URL);
    const jwtConfigured = Boolean(process.env.JWT_SECRET);
    const frontendUrl = process.env.FRONTEND_URL || "https://hetdclpms-frontend.vercel.app";
    const moduleCards = exports.apiModules.map((module, mIdx) => {
        const rows = module.endpoints.map((endpoint) => {
            const fullPath = module.basePath === "/api"
                ? endpoint.path
                : `${module.basePath}${endpoint.path === "/" ? "" : endpoint.path}`;
            const methodColors = {
                GET: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
                POST: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
                PUT: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
                PATCH: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
                DELETE: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
            };
            const mStyle = methodColors[endpoint.method] || methodColors.GET;
            return `
        <tr class="endpoint-row" data-search="${escapeHtml((endpoint.method + ' ' + fullPath + ' ' + endpoint.title + ' ' + (endpoint.description || '')).toLowerCase())}">
          <td style="width: 100px;">
            <span class="badge-method" style="background:${mStyle.bg}; color:${mStyle.text}; border:1px solid ${mStyle.border};">
              ${endpoint.method}
            </span>
          </td>
          <td>
            <div class="endpoint-path-wrap">
              <code class="endpoint-path">${escapeHtml(fullPath)}</code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(fullPath)}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500)">Copy</button>
            </div>
          </td>
          <td>
            <div class="endpoint-title">${escapeHtml(endpoint.title)}</div>
            ${endpoint.description ? `<div class="endpoint-desc">${escapeHtml(endpoint.description)}</div>` : ""}
          </td>
          <td style="text-align: right; width: 90px;">
            ${endpoint.auth === false
                ? '<span class="badge-tag badge-public">Public</span>'
                : '<span class="badge-tag badge-auth">JWT</span>'}
          </td>
        </tr>
      `;
        }).join("");
        return `
      <section class="module-card" id="mod-${mIdx}">
        <div class="module-header">
          <div>
            <div class="module-title-row">
              <span class="module-badge">Module 0${mIdx + 1}</span>
              <h2>${escapeHtml(module.name)}</h2>
            </div>
            <p class="module-desc">${escapeHtml(module.description)}</p>
          </div>
          <span class="endpoint-count">${module.endpoints.length} Endpoints</span>
        </div>
        <div class="table-container">
          <table class="endpoint-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Action & Description</th>
                <th style="text-align: right;">Access</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
    }).join("");
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HET PMS — API Service & Diagnostics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #f59e0b;
      --accent-glow: rgba(245, 158, 11, 0.15);
      --success: #10b981;
      --danger: #ef4444;
      --brand: #6366f1;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.5;
    }
    .wrapper { width: min(1200px, calc(100% - 40px)); margin: 0 auto; }
    
    /* Top Banner */
    header {
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #090d16 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 48px 0 36px;
      position: relative;
    }
    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      color: #fbbf24;
      font-size: 13px;
      font-weight: 600;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 12px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    h1 {
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .lead {
      color: #94a3b8;
      font-size: 16px;
      max-width: 760px;
    }

    /* Live Status Cards */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-top: 32px;
    }
    .status-card {
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .status-card-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .status-card-value {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-card-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .tag-ok { color: #34d399; }
    .tag-warn { color: #fbbf24; }

    /* Interactive Action Bar */
    .action-bar {
      margin: 28px 0 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      background: #111827;
      border: 1px solid #374151;
      border-radius: 10px;
      padding: 12px 16px 12px 42px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 16px;
    }
    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #1f293d;
      color: #e2e8f0;
      border: 1px solid #334155;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #334155;
      color: #ffffff;
      border-color: #475569;
    }
    .btn-primary {
      background: #4f46e5;
      border-color: #6366f1;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }

    /* Diagnostics Banner */
    .diag-box {
      background: linear-gradient(145deg, #131b2e 0%, #0d121f 100%);
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .diag-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .diag-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    .diag-item-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .diag-item-content { font-family: 'JetBrains Mono', monospace; font-size: 12px; margin-top: 4px; color: #cbd5e1; word-break: break-all; }

    /* Module Cards */
    .module-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .module-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      background: rgba(255,255,255,0.015);
    }
    .module-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .module-badge {
      font-size: 11px;
      font-weight: 700;
      color: #a5b4fc;
      background: rgba(99, 102, 241, 0.15);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .module-header h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
    }
    .module-desc {
      font-size: 13px;
      color: #94a3b8;
    }
    .endpoint-count {
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
      background: #1e293b;
      padding: 6px 12px;
      border-radius: 999px;
      white-space: nowrap;
      border: 1px solid #334155;
    }

    /* Table Styles */
    .table-container { overflow-x: auto; }
    .endpoint-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      min-width: 720px;
    }
    .endpoint-table th {
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      background: rgba(15, 23, 42, 0.7);
      padding: 12px 20px;
      border-bottom: 1px solid var(--card-border);
    }
    .endpoint-table td {
      padding: 14px 20px;
      border-bottom: 1px solid rgba(31, 41, 61, 0.6);
      vertical-align: middle;
    }
    .endpoint-table tr:last-child td { border-bottom: none; }
    .endpoint-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    /* Endpoint Badges */
    .badge-method {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 68px;
      padding: 4px 0;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      text-align: center;
    }
    .endpoint-path-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      background: rgba(15, 23, 42, 0.8);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #1e293b;
    }
    .copy-btn {
      background: transparent;
      border: 1px solid #334155;
      color: #94a3b8;
      border-radius: 5px;
      padding: 3px 7px;
      font-size: 11px;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      opacity: 1;
      color: #ffffff;
      border-color: #64748b;
    }
    .endpoint-title {
      font-weight: 600;
      color: #f1f5f9;
    }
    .endpoint-desc {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
    }
    .badge-public {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-auth {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    footer {
      text-align: center;
      padding: 36px 0 48px;
      color: #64748b;
      font-size: 13px;
      border-top: 1px solid var(--card-border);
      margin-top: 48px;
    }
  </style>
</head>
<body>

  <header>
    <div class="wrapper">
      <div class="hero-top">
        <div class="brand-pill">
          <span class="pulse-dot"></span>
          HET PMS Backend Engine v1.0
        </div>
        <div style="font-size: 13px; color: #94a3b8;">
          Environment: <strong style="color:#ffffff;">${process.env.NODE_ENV || 'production'}</strong>
        </div>
      </div>
      <h1>HET PMS API & System Dashboard</h1>
      <p class="lead">
        Centralized Property Management System API Service. All data modules, financial ledgers, inventory, and engineering endpoints are indexed below.
      </p>

      <div class="status-grid">
        <div class="status-card">
          <div class="status-card-label">Server Status</div>
          <div class="status-card-value tag-ok">
            <span class="pulse-dot"></span> Online & Active
          </div>
          <div class="status-card-sub">Express 5 Serverless Engine</div>
        </div>

        <div class="status-card">
          <div class="status-card-label">Database Configuration</div>
          <div class="status-card-value ${dbConfigured ? 'tag-ok' : 'tag-warn'}">
            ${dbConfigured ? '✓ MongoDB Configured' : '⚠ Missing DATABASE_URL'}
          </div>
          <div class="status-card-sub">Prisma Client ORM Engine</div>
        </div>

        <div class="status-card">
          <div class="status-card-label">Security & Auth</div>
          <div class="status-card-value ${jwtConfigured ? 'tag-ok' : 'tag-warn'}">
            ${jwtConfigured ? '✓ JWT Secret Active' : '⚠ Secret Not Set'}
          </div>
          <div class="status-card-sub">Bearer Token Authentication</div>
        </div>

        <div class="status-card">
          <div class="status-card-label">API Surface</div>
          <div class="status-card-value" style="color:#818cf8;">
            ${catalog.totalEndpoints} Endpoints
          </div>
          <div class="status-card-sub">Across ${catalog.totalModules} Core Modules</div>
        </div>
      </div>
    </div>
  </header>

  <main class="wrapper" style="padding-top: 24px;">

    <!-- System Diagnostics -->
    <div class="diag-box">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <h3 style="font-size:15px; font-weight:700; color:#e2e8f0;">⚡ System Diagnostics & Quick Test</h3>
        <span style="font-size:12px; color:#94a3b8;">CORS Target: <code style="color:#60a5fa;">${escapeHtml(frontendUrl)}</code></span>
      </div>
      
      <div class="diag-grid">
        <div class="diag-item">
          <div class="diag-item-title">Default Admin Login</div>
          <div class="diag-item-content">
            Email: <strong>superadmin@hetpms.com</strong><br>
            Pass: <strong>admin@123</strong>
          </div>
        </div>
        <div class="diag-item">
          <div class="diag-item-title">Health Check Response</div>
          <div class="diag-item-content">
            <span id="health-test-status">Click to test live DB connection</span>
          </div>
        </div>
        <div class="diag-item" style="display:flex; flex-direction:column; justify-content:center;">
          <button class="btn btn-primary" onclick="testHealth()" id="test-btn">Run Deep Health Check</button>
        </div>
      </div>
    </div>

    <!-- Search and Actions Bar -->
    <div class="action-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="api-search" placeholder="Search by path, title, or method (e.g., 'login', 'POST', 'projects', 'voucher')..." oninput="filterEndpoints(this.value)">
      </div>
      <div class="quick-links">
        <a href="/health" target="_blank" class="btn">JSON Health Check ↗</a>
        <a href="/api/catalog" target="_blank" class="btn">JSON Catalog ↗</a>
      </div>
    </div>

    <!-- API Modules Grid -->
    <div id="modules-wrapper">
      ${moduleCards}
    </div>

    <footer>
      HET PMS Enterprise Property Management System &bull; API Documentation & Diagnostics Portal
    </footer>
  </main>

  <script>
    function filterEndpoints(query) {
      const q = query.trim().toLowerCase();
      const rows = document.querySelectorAll('.endpoint-row');
      const cards = document.querySelectorAll('.module-card');

      rows.forEach(row => {
        const text = row.getAttribute('data-search') || '';
        if (!q || text.includes(q)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });

      cards.forEach(card => {
        const visibleRows = card.querySelectorAll('.endpoint-row:not([style*="display: none"])');
        card.style.display = visibleRows.length > 0 ? '' : 'none';
      });
    }

    async function testHealth() {
      const btn = document.getElementById('test-btn');
      const statusEl = document.getElementById('health-test-status');
      btn.innerText = 'Checking...';
      try {
        const res = await fetch('/health');
        const data = await res.json();
        if (data.status === 'healthy') {
          statusEl.innerHTML = '<span style="color:#34d399; font-weight:700;">✓ Database Connected (' + (data.database?.latencyMs || 0) + 'ms)</span>';
        } else {
          statusEl.innerHTML = '<span style="color:#fbbf24; font-weight:700;">⚠ ' + (data.database?.error || 'Database disconnected') + '</span>';
        }
      } catch (err) {
        statusEl.innerHTML = '<span style="color:#ef4444; font-weight:700;">✕ Connection Failed</span>';
      } finally {
        btn.innerText = 'Run Deep Health Check';
      }
    }
  </script>
</body>
</html>`;
}
//# sourceMappingURL=api-docs.js.map