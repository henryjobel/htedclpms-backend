"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiModules = void 0;
exports.getApiCatalog = getApiCatalog;
exports.renderApiDocsHtml = renderApiDocsHtml;
exports.apiModules = [
    {
        name: "Auth",
        basePath: "/api/auth",
        description: "Login, registration, profile and password APIs.",
        endpoints: [
            { method: "POST", path: "/login", auth: false, title: "Login", description: "Returns JWT token and user profile." },
            { method: "POST", path: "/register", auth: false, title: "Register User" },
            { method: "GET", path: "/me", title: "Current User" },
            { method: "POST", path: "/change-password", title: "Change Password" },
        ],
    },
    {
        name: "Projects",
        basePath: "/api/projects",
        description: "Construction projects, BOQ, tasks, progress, quotations and work orders.",
        endpoints: [
            { method: "GET", path: "/", title: "Project List" },
            { method: "POST", path: "/", title: "Create Project" },
            { method: "GET", path: "/:id", title: "Project Details" },
            { method: "PUT", path: "/:id", title: "Update Project" },
            { method: "DELETE", path: "/:id", title: "Delete Project" },
            { method: "GET", path: "/:id/boq", title: "Project BOQ" },
            { method: "POST", path: "/:id/boq", title: "Create BOQ Item" },
            { method: "PUT", path: "/boq/:itemId", title: "Update BOQ Item" },
            { method: "DELETE", path: "/boq/:itemId", title: "Delete BOQ Item" },
            { method: "GET", path: "/:id/tasks", title: "Project Tasks" },
            { method: "POST", path: "/:id/tasks", title: "Create Task" },
            { method: "PATCH", path: "/:id/tasks/:taskId", title: "Update Task" },
            { method: "DELETE", path: "/:id/tasks/:taskId", title: "Delete Task" },
            { method: "GET", path: "/:id/progress", title: "Progress Logs" },
            { method: "POST", path: "/:id/progress", title: "Create Progress Log" },
            { method: "DELETE", path: "/:id/progress/:logId", title: "Delete Progress Log" },
            { method: "GET", path: "/quotations/all", title: "Quotation List" },
            { method: "POST", path: "/quotations", title: "Create Quotation" },
            { method: "PUT", path: "/quotations/:id", title: "Update Quotation" },
            { method: "DELETE", path: "/quotations/:id", title: "Delete Quotation" },
            { method: "GET", path: "/work-orders/all", title: "Work Order List" },
            { method: "POST", path: "/work-orders", title: "Create Work Order" },
            { method: "PUT", path: "/work-orders/:id", title: "Update Work Order" },
            { method: "DELETE", path: "/work-orders/:id", title: "Delete Work Order" },
        ],
    },
    {
        name: "Inventory",
        basePath: "/api/inventory",
        description: "Products, suppliers, requisitions, RFQ, purchase orders, GRN and stock adjustments.",
        endpoints: [
            { method: "GET", path: "/products", title: "Product List" },
            { method: "POST", path: "/products", title: "Create Product" },
            { method: "PUT", path: "/products/:id", title: "Update Product" },
            { method: "POST", path: "/products/:id/adjustment", title: "Adjust Product Stock" },
            { method: "DELETE", path: "/products/:id", title: "Delete Product" },
            { method: "GET", path: "/suppliers", title: "Supplier List" },
            { method: "POST", path: "/suppliers", title: "Create Supplier" },
            { method: "GET", path: "/requisitions", title: "Material Requisitions" },
            { method: "POST", path: "/requisitions", title: "Create Requisition" },
            { method: "PATCH", path: "/requisitions/:id/status", title: "Update Requisition Status" },
            { method: "DELETE", path: "/requisitions/:id", title: "Delete Requisition" },
            { method: "GET", path: "/rfqs", title: "RFQ List" },
            { method: "POST", path: "/rfqs", title: "Create RFQ" },
            { method: "PUT", path: "/rfqs/:id", title: "Update RFQ" },
            { method: "GET", path: "/rfqs/comparison", title: "RFQ Comparison" },
            { method: "PATCH", path: "/rfqs/:id/select", title: "Select RFQ" },
            { method: "DELETE", path: "/rfqs/:id", title: "Delete RFQ" },
            { method: "GET", path: "/purchase-orders", title: "Purchase Orders" },
            { method: "POST", path: "/purchase-orders", title: "Create Purchase Order" },
            { method: "PATCH", path: "/purchase-orders/:id/status", title: "Update PO Status" },
            { method: "DELETE", path: "/purchase-orders/:id", title: "Delete Purchase Order" },
            { method: "GET", path: "/grns", title: "Goods Receipt Notes" },
            { method: "POST", path: "/grns", title: "Create GRN" },
            { method: "DELETE", path: "/grns/:id", title: "Delete GRN" },
            { method: "GET", path: "/adjustments", title: "Stock Adjustments" },
            { method: "DELETE", path: "/adjustments/:id", title: "Delete Adjustment" },
        ],
    },
    {
        name: "Accounts",
        basePath: "/api/accounts",
        description: "Chart of accounts, vouchers, ledger, installments, bank/cash and reports.",
        endpoints: [
            { method: "GET", path: "/chart", title: "Chart of Accounts" },
            { method: "POST", path: "/chart", title: "Create Account" },
            { method: "PUT", path: "/chart/:id", title: "Update Account" },
            { method: "DELETE", path: "/chart/:id", title: "Delete Account" },
            { method: "GET", path: "/vouchers", title: "Vouchers" },
            { method: "POST", path: "/vouchers", title: "Create Voucher" },
            { method: "PATCH", path: "/vouchers/:id/approve", title: "Approve Voucher" },
            { method: "DELETE", path: "/vouchers/:id", title: "Delete Voucher" },
            { method: "GET", path: "/approval-logs", title: "Approval Logs" },
            { method: "GET", path: "/pending-approvals", title: "Pending Approvals" },
            { method: "GET", path: "/ledger", title: "General Ledger" },
            { method: "GET", path: "/installments", title: "Installments" },
            { method: "POST", path: "/installments", title: "Create Installment" },
            { method: "POST", path: "/installments/:id/pay", title: "Pay Installment" },
            { method: "DELETE", path: "/installments/:id", title: "Delete Installment" },
            { method: "GET", path: "/bank-accounts", title: "Bank Accounts" },
            { method: "POST", path: "/bank-accounts", title: "Create Bank Account" },
            { method: "POST", path: "/bank-transactions", title: "Create Bank Transaction" },
            { method: "DELETE", path: "/bank-transactions/:id", title: "Delete Bank Transaction" },
            { method: "GET", path: "/cash-book", title: "Cash Book" },
            { method: "GET", path: "/bank-reconciliations", title: "Bank Reconciliations" },
            { method: "POST", path: "/bank-reconciliations", title: "Create Bank Reconciliation" },
            { method: "PUT", path: "/bank-reconciliations/:id", title: "Update Bank Reconciliation" },
            { method: "DELETE", path: "/bank-reconciliations/:id", title: "Delete Bank Reconciliation" },
            { method: "GET", path: "/cheques", title: "Cheques" },
            { method: "POST", path: "/cheques", title: "Create Cheque" },
            { method: "PUT", path: "/cheques/:id", title: "Update Cheque" },
            { method: "DELETE", path: "/cheques/:id", title: "Delete Cheque" },
            { method: "GET", path: "/profit-loss", title: "Profit & Loss" },
            { method: "GET", path: "/balance-sheet", title: "Balance Sheet" },
            { method: "GET", path: "/cash-flow", title: "Cash Flow" },
            { method: "GET", path: "/dashboard-summary", title: "Dashboard Summary" },
            { method: "GET", path: "/sales-forecast", title: "Sales Forecast" },
            { method: "GET", path: "/trial-balance", title: "Trial Balance" },
            { method: "GET", path: "/day-book", title: "Day Book" },
            { method: "GET", path: "/receive-payment-summary", title: "Receive Payment Summary" },
        ],
    },
    {
        name: "Contractors & Workers",
        basePath: "/api",
        description: "Contractor profiles, assignments, payments, worker profiles and attendance.",
        endpoints: [
            { method: "GET", path: "/contractors", title: "Contractors" },
            { method: "POST", path: "/contractors", title: "Create Contractor" },
            { method: "PUT", path: "/contractors/:id", title: "Update Contractor" },
            { method: "POST", path: "/contractors/:id/assign", title: "Assign Contractor" },
            { method: "POST", path: "/contractors/assignments/:id/pay", title: "Pay Contractor Assignment" },
            { method: "DELETE", path: "/contractors/:id", title: "Deactivate Contractor" },
            { method: "GET", path: "/workers", title: "Workers" },
            { method: "POST", path: "/workers", title: "Create Worker" },
            { method: "PUT", path: "/workers/:id", title: "Update Worker" },
            { method: "POST", path: "/workers/:id/attendance", title: "Worker Attendance" },
            { method: "DELETE", path: "/workers/:id", title: "Deactivate Worker" },
        ],
    },
    {
        name: "Bills & Operations",
        basePath: "/api",
        description: "Supplier bills, project billing, assets, maintenance and approval layers.",
        endpoints: [
            { method: "GET", path: "/bills", title: "Supplier Bills" },
            { method: "POST", path: "/bills", title: "Create Supplier Bill" },
            { method: "PATCH", path: "/bills/:id/status", title: "Update Supplier Bill Status" },
            { method: "DELETE", path: "/bills/:id", title: "Delete Supplier Bill" },
            { method: "GET", path: "/operations/billing", title: "Billing Records" },
            { method: "POST", path: "/operations/billing", title: "Create Billing Record" },
            { method: "PUT", path: "/operations/billing/:id", title: "Update Billing Record" },
            { method: "PATCH", path: "/operations/billing/:id/status", title: "Update Billing Status" },
            { method: "DELETE", path: "/operations/billing/:id", title: "Delete Billing Record" },
            { method: "GET", path: "/operations/assets", title: "Assets" },
            { method: "POST", path: "/operations/assets", title: "Create Asset" },
            { method: "PUT", path: "/operations/assets/:id", title: "Update Asset" },
            { method: "DELETE", path: "/operations/assets/:id", title: "Delete Asset" },
            { method: "GET", path: "/operations/asset-maintenance", title: "Asset Maintenance" },
            { method: "POST", path: "/operations/asset-maintenance", title: "Create Maintenance" },
            { method: "PUT", path: "/operations/asset-maintenance/:id", title: "Update Maintenance" },
            { method: "DELETE", path: "/operations/asset-maintenance/:id", title: "Delete Maintenance" },
            { method: "GET", path: "/operations/assets/depreciation-summary", title: "Depreciation Summary" },
            { method: "GET", path: "/operations/approval-layers", title: "Approval Layers" },
            { method: "POST", path: "/operations/approval-layers", title: "Create Approval Layer" },
            { method: "PUT", path: "/operations/approval-layers/:id", title: "Update Approval Layer" },
            { method: "DELETE", path: "/operations/approval-layers/:id", title: "Delete Approval Layer" },
        ],
    },
    {
        name: "Real Estate",
        basePath: "/api/real-estate",
        description: "Blocks, roads, units, bookings, sales and real estate reports.",
        endpoints: [
            { method: "GET", path: "/summary", title: "Real Estate Summary" },
            { method: "GET", path: "/collection-report", title: "Collection Report" },
            { method: "GET", path: "/aging-report", title: "Aging Report" },
            { method: "GET", path: "/blocks", title: "Blocks" },
            { method: "POST", path: "/blocks", title: "Create Block" },
            { method: "PUT", path: "/blocks/:id", title: "Update Block" },
            { method: "DELETE", path: "/blocks/:id", title: "Delete Block" },
            { method: "GET", path: "/roads", title: "Roads" },
            { method: "POST", path: "/roads", title: "Create Road" },
            { method: "PUT", path: "/roads/:id", title: "Update Road" },
            { method: "DELETE", path: "/roads/:id", title: "Delete Road" },
            { method: "GET", path: "/units", title: "Property Units" },
            { method: "POST", path: "/units", title: "Create Unit" },
            { method: "PUT", path: "/units/:id", title: "Update Unit" },
            { method: "DELETE", path: "/units/:id", title: "Delete Unit" },
            { method: "GET", path: "/bookings", title: "Bookings" },
            { method: "POST", path: "/bookings", title: "Create Booking" },
            { method: "PUT", path: "/bookings/:id", title: "Update Booking" },
            { method: "DELETE", path: "/bookings/:id", title: "Delete Booking" },
            { method: "POST", path: "/bookings/:id/cancel", title: "Cancel Booking" },
            { method: "GET", path: "/sales", title: "Sales" },
            { method: "POST", path: "/sales", title: "Create Sale" },
            { method: "PUT", path: "/sales/:id", title: "Update Sale" },
            { method: "DELETE", path: "/sales/:id", title: "Delete Sale" },
            { method: "POST", path: "/sales/:id/installment-plan", title: "Create Sale Installment Plan" },
        ],
    },
    {
        name: "Investment & Share Project",
        basePath: "/api",
        description: "Investors, project investments, share assignment and share configuration.",
        endpoints: [
            { method: "GET", path: "/investment/investors", title: "Investors" },
            { method: "POST", path: "/investment/investors", title: "Create Investor" },
            { method: "PUT", path: "/investment/investors/:id", title: "Update Investor" },
            { method: "DELETE", path: "/investment/investors/:id", title: "Delete Investor" },
            { method: "GET", path: "/investment/investments", title: "Investments" },
            { method: "POST", path: "/investment/investments", title: "Create Investment" },
            { method: "PUT", path: "/investment/investments/:id", title: "Update Investment" },
            { method: "DELETE", path: "/investment/investments/:id", title: "Delete Investment" },
            { method: "GET", path: "/share-project/assignments", title: "Share Assignments" },
            { method: "POST", path: "/share-project/assignments", title: "Create Share Assignment" },
            { method: "PUT", path: "/share-project/assignments/:id", title: "Update Share Assignment" },
            { method: "DELETE", path: "/share-project/assignments/:id", title: "Delete Share Assignment" },
            { method: "GET", path: "/share-project/configs", title: "Share Configs" },
            { method: "POST", path: "/share-project/configs", title: "Create Share Config" },
            { method: "PUT", path: "/share-project/configs/:id", title: "Update Share Config" },
            { method: "DELETE", path: "/share-project/configs/:id", title: "Delete Share Config" },
        ],
    },
    {
        name: "Documents, Sites & Gantt",
        basePath: "/api",
        description: "Project document, site and Gantt task CRUD APIs.",
        endpoints: [
            { method: "GET", path: "/documents", title: "Documents" },
            { method: "POST", path: "/documents", title: "Create Document" },
            { method: "PUT", path: "/documents/:id", title: "Update Document" },
            { method: "DELETE", path: "/documents/:id", title: "Delete Document" },
            { method: "GET", path: "/sites", title: "Sites" },
            { method: "POST", path: "/sites", title: "Create Site" },
            { method: "PUT", path: "/sites/:id", title: "Update Site" },
            { method: "DELETE", path: "/sites/:id", title: "Delete Site" },
            { method: "GET", path: "/gantt", title: "Gantt Tasks" },
            { method: "POST", path: "/gantt", title: "Create Gantt Task" },
            { method: "PUT", path: "/gantt/:id", title: "Update Gantt Task" },
            { method: "DELETE", path: "/gantt/:id", title: "Delete Gantt Task" },
        ],
    },
    {
        name: "Users, Roles & Admin",
        basePath: "/api",
        description: "Users, roles, permissions, role editor and activity logs.",
        endpoints: [
            { method: "GET", path: "/users/roles", title: "User Roles" },
            { method: "GET", path: "/users", title: "Users" },
            { method: "POST", path: "/users", title: "Create User" },
            { method: "PUT", path: "/users/:id", title: "Update User" },
            { method: "PATCH", path: "/users/:id/status", title: "Toggle User Status" },
            { method: "DELETE", path: "/users/:id", title: "Delete User" },
            { method: "GET", path: "/admin/permissions/catalog", title: "Permission Catalog" },
            { method: "GET", path: "/admin/roles", title: "Admin Roles" },
            { method: "POST", path: "/admin/roles", title: "Create Role" },
            { method: "PUT", path: "/admin/roles/:id", title: "Update Role" },
            { method: "GET", path: "/admin/activity", title: "Activity Log" },
        ],
    },
    {
        name: "Settings, Masters & Reports",
        basePath: "/api",
        description: "System settings, reusable master lists, CSV exports and operational reports.",
        endpoints: [
            { method: "GET", path: "/settings/system", title: "System Settings" },
            { method: "PUT", path: "/settings/system", title: "Save System Settings" },
            { method: "GET", path: "/masters/definitions", title: "Master Definitions" },
            { method: "GET", path: "/masters/company-profile", title: "Company Profile" },
            { method: "PUT", path: "/masters/company-profile", title: "Save Company Profile" },
            { method: "GET", path: "/masters/account-summaries/customers", title: "Customer Account Summaries" },
            { method: "GET", path: "/masters/account-summaries/suppliers", title: "Supplier Account Summaries" },
            { method: "GET", path: "/masters/:masterKey", title: "Master List" },
            { method: "POST", path: "/masters/:masterKey", title: "Create Master Item" },
            { method: "PUT", path: "/masters/:masterKey/:id", title: "Update Master Item" },
            { method: "DELETE", path: "/masters/:masterKey/:id", title: "Delete Master Item" },
            { method: "GET", path: "/reports/export/:type", title: "CSV Export" },
            { method: "GET", path: "/reports/operational", title: "Operational Reports" },
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
function methodClass(method) {
    return `method method-${method.toLowerCase()}`;
}
function getApiCatalog() {
    const totalEndpoints = exports.apiModules.reduce((sum, module) => sum + module.endpoints.length, 0);
    return {
        service: "HET PMS API",
        version: "1.0.0",
        health: "/health",
        totalModules: exports.apiModules.length,
        totalEndpoints,
        auth: {
            type: "Bearer JWT",
            login: "/api/auth/login",
            header: "Authorization: Bearer <token>",
            defaultLogin: {
                email: "superadmin@hetpms.com",
                password: "admin@123",
            },
        },
        modules: exports.apiModules,
    };
}
function renderApiDocsHtml(baseUrl) {
    const catalog = getApiCatalog();
    const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    const moduleCards = exports.apiModules.map((module) => {
        const rows = module.endpoints.map((endpoint) => {
            const fullPath = module.basePath === "/api"
                ? endpoint.path
                : `${module.basePath}${endpoint.path === "/" ? "" : endpoint.path}`;
            return `
        <tr>
          <td><span class="${methodClass(endpoint.method)}">${endpoint.method}</span></td>
          <td><code>${escapeHtml(fullPath)}</code></td>
          <td>${escapeHtml(endpoint.title)}</td>
          <td>${endpoint.auth === false ? "<span class=\"public\">Public</span>" : "<span class=\"protected\">JWT</span>"}</td>
        </tr>
      `;
        }).join("");
        return `
      <section class="card">
        <div class="card-head">
          <div>
            <h2>${escapeHtml(module.name)}</h2>
            <p>${escapeHtml(module.description)}</p>
          </div>
          <span class="count">${module.endpoints.length} APIs</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Method</th><th>Endpoint</th><th>Purpose</th><th>Auth</th></tr>
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
  <title>HET PMS API Documentation</title>
  <style>
    :root { color-scheme: light; --bg:#f5f7fb; --card:#ffffff; --ink:#101828; --muted:#667085; --line:#e4e7ec; --brand:#7c3aed; --soft:#f3f0ff; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--ink); }
    header { background:#111827; color:white; padding:34px 24px 28px; }
    .wrap { width:min(1180px, calc(100% - 32px)); margin:0 auto; }
    .eyebrow { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#c4b5fd; font-weight:700; }
    h1 { margin:8px 0 8px; font-size:34px; line-height:1.1; }
    header p { color:#d1d5db; margin:0; max-width:780px; }
    .stats { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-top:24px; }
    .stat { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:14px; }
    .stat b { display:block; font-size:22px; }
    .stat span { color:#d1d5db; font-size:12px; }
    main { padding:22px 0 48px; }
    .toolbar { display:grid; grid-template-columns: 1.2fr .8fr; gap:14px; margin-bottom:18px; }
    .panel, .card { background:var(--card); border:1px solid var(--line); border-radius:10px; box-shadow:0 1px 2px rgba(16,24,40,.04); }
    .panel { padding:16px; }
    .panel h2 { margin:0 0 8px; font-size:15px; }
    .panel p { margin:0; color:var(--muted); font-size:13px; line-height:1.55; }
    code { background:#f2f4f7; border:1px solid #e4e7ec; border-radius:6px; padding:3px 6px; font-size:12px; white-space:nowrap; }
    .grid { display:grid; gap:14px; }
    .card { overflow:hidden; }
    .card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 16px 12px; border-bottom:1px solid var(--line); }
    .card h2 { margin:0 0 4px; font-size:18px; }
    .card p { margin:0; color:var(--muted); font-size:13px; }
    .count { background:var(--soft); color:#5b21b6; border-radius:999px; padding:5px 10px; font-size:12px; font-weight:700; white-space:nowrap; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; min-width:760px; }
    th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#667085; background:#f9fafb; padding:10px 12px; border-bottom:1px solid var(--line); }
    td { padding:10px 12px; border-bottom:1px solid #f0f2f5; font-size:13px; vertical-align:middle; }
    tr:last-child td { border-bottom:0; }
    .method { display:inline-flex; min-width:58px; justify-content:center; border-radius:6px; padding:4px 7px; font-weight:800; font-size:11px; color:white; }
    .method-get { background:#2563eb; }
    .method-post { background:#16a34a; }
    .method-put { background:#9333ea; }
    .method-patch { background:#d97706; }
    .method-delete { background:#dc2626; }
    .public, .protected { display:inline-flex; border-radius:999px; padding:3px 8px; font-size:11px; font-weight:700; }
    .public { background:#ecfdf3; color:#027a48; }
    .protected { background:#fff7ed; color:#b45309; }
    .links { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
    .links a { color:#5b21b6; background:#f5f3ff; border:1px solid #ddd6fe; text-decoration:none; padding:7px 10px; border-radius:8px; font-size:12px; font-weight:700; }
    footer { color:#98a2b3; font-size:12px; margin-top:18px; }
    @media (max-width: 820px) { .stats, .toolbar { grid-template-columns:1fr; } h1 { font-size:28px; } header { padding-top:26px; } }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="eyebrow">Backend API Index</div>
      <h1>HET PMS API Documentation</h1>
      <p>Open this backend URL anytime to see all available API modules from A to Z. Protected endpoints require a JWT token from the login API.</p>
      <div class="stats">
        <div class="stat"><b>${catalog.totalModules}</b><span>Modules</span></div>
        <div class="stat"><b>${catalog.totalEndpoints}</b><span>Endpoints</span></div>
        <div class="stat"><b>${escapeHtml(baseUrl)}</b><span>Base URL</span></div>
        <div class="stat"><b>JWT</b><span>Auth Type</span></div>
      </div>
    </div>
  </header>
  <main class="wrap">
    <div class="toolbar">
      <div class="panel">
        <h2>How To Use</h2>
        <p>Login at <code>POST /api/auth/login</code>, then send <code>Authorization: Bearer &lt;token&gt;</code> for protected APIs.</p>
        <div class="links">
          <a href="/health">Health Check</a>
          <a href="/api/catalog">JSON Catalog</a>
          <a href="/api/auth/login">Login Endpoint</a>
        </div>
      </div>
      <div class="panel">
        <h2>Default Development Login</h2>
        <p>Email: <code>${catalog.auth.defaultLogin.email}</code><br>Password: <code>${catalog.auth.defaultLogin.password}</code></p>
      </div>
    </div>
    <div class="grid">${moduleCards}</div>
    <footer>Generated ${escapeHtml(generatedAt)}. Keep this catalog updated when adding new backend routes.</footer>
  </main>
</body>
</html>`;
}
//# sourceMappingURL=api-docs.js.map