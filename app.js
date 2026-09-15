const app = document.getElementById('app');
const logo = './assets/bi-quicker-logo.png';

const icons = {
  customer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10h18l-1-5H4l-1 5Z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/><path d="M3 10c0 1.5 1.3 2.5 2.7 2.5S8.5 11.5 8.5 10c0 1.5 1.3 2.5 2.7 2.5s2.8-1 2.8-2.5c0 1.5 1.3 2.5 2.7 2.5S19.5 11.5 19.5 10"/></svg>`,
  rider: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-8h5l4 8M9 9l-2-3h4l2 3M11 17h4"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.1 3.7M6.2 6.2C3.4 8.2 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"/></svg>`,
};

const roles = {
  customer: { title: 'Customer', short: 'Customer', description: 'Browse stores, shop products, and track your orders', signin: 'Sign in to start shopping', intro: 'Browse thousands of stores, discover amazing products, and get everything delivered to your doorstep.', theme: 'blue', icon: icons.customer, stats: [['1000+', 'Active Stores'], ['10K+', 'Products'], ['30 min', 'Avg. Delivery'], ['24/7', 'Support']], email: 'you@example.com', footer: `Don't have an account?`, signup: 'Sign up', button: 'Sign In', security: false },
  store: { title: 'Store Admin', short: 'Store Owner', description: 'Manage your store, products, and orders', signin: 'Access your store dashboard', intro: 'Manage your store, products, and orders all in one place. Grow your business with Bi-quicker.', theme: 'orange', icon: icons.store, stats: [['50K+', 'Customers'], ['99%', 'Uptime'], ['₦0', 'Setup Fee'], ['24/7', 'Support']], email: 'store@example.com', footer: `Don't have a store yet?`, signup: 'Register your store', button: 'Sign In', security: false },
  rider: { title: 'Rider', short: 'Delivery Rider', description: 'Accept deliveries and earn money on your schedule', signin: 'Access your rider dashboard', intro: 'Start delivering and earning on your own schedule. Your next delivery is just a tap away.', theme: 'green', icon: icons.rider, stats: [['₦3500/hr', 'Avg. Earnings'], ['500+', 'Active Riders'], ['100%', 'Keep Your Tips'], ['24/7', 'Support']], email: 'rider@example.com', footer: 'Want to become a rider?', signup: 'Apply now', button: 'Sign In', security: false },
  admin: { title: 'Super Admin', short: 'Super Admin', description: 'Manage the entire platform and monitor operations', signin: 'Secure access to admin dashboard', intro: 'Manage the entire Bi-quicker platform. Monitor operations, manage users, and ensure smooth service delivery.', theme: 'purple', icon: icons.admin, stats: [['1000+', 'Active Stores'], ['50K+', 'Customers'], ['500+', 'Riders'], ['100K+', 'Orders Completed']], email: 'admin@bi-quicker.com', footer: '', signup: '', button: 'Sign In', security: true }
};

function route() {
  const p = location.hash.replace(/^#/, '') || '/';
  if (p === '/' || p === '') return renderRoleSelection();
  const m = p.match(/^\/(customer|store-admin|rider|super-admin)\/(signin|signup)$/);
  if (m) return renderAuth(m[1], m[2]);
  return renderRoleSelection();
}
function go(path) { location.hash = path; }
function roleKey(segment) { return segment === 'store-admin' ? 'store' : segment === 'super-admin' ? 'admin' : segment; }

function renderRoleSelection() {
  app.innerHTML = `<section class="page role-page"><div class="role-shell"><header class="role-header"><img class="logo-mark" src="${logo}" alt="Bi-quicker" /><h1 class="role-title">Welcome to <span>Bi-quicker</span></h1><p class="role-subtitle">Choose your role to get started</p></header><div class="roles">${['customer','store','rider','admin'].map(k => { const r = roles[k]; const path = k === 'store' ? '/store-admin/signin' : k === 'admin' ? '/super-admin/signin' : `/${k}/signin`; return `<article class="role-card" tabindex="0" data-route="${path}"><div class="role-icon ${r.theme}">${r.icon}</div><h2>${r.short}</h2><p>${r.description}</p><button class="primary" data-route="${path}">Continue as ${r.short}</button></article>`; }).join('')}</div><footer class="role-footer">By continuing, you agree to our <a href="#" onclick="return false">Terms of Service</a> and <a href="#" onclick="return false">Privacy Policy</a></footer></div></section>`;
  document.querySelectorAll('[data-route]').forEach(el => { el.addEventListener('click', e => { e.stopPropagation(); go(el.dataset.route); }); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(el.dataset.route); } }); });
}

function renderAuth(segment, mode) {
  const key = roleKey(segment), r = roles[key];
  if (mode === 'signup') return renderSignup(key, segment);
  app.innerHTML = `<section class="auth-page theme-${r.theme}"><div class="auth-shell"><div class="auth-brand"><button class="back" data-back>${icons.arrowLeft} Back to role selection</button><img class="logo-mark logo-small" src="${logo}" alt="Bi-quicker" /><div class="brand-heading"><div class="role-icon ${r.theme}">${r.icon}</div><h1>${r.title} Sign In</h1></div><p class="brand-copy">${r.intro}</p><div class="stats">${r.stats.map(([n,l]) => `<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join('')}</div></div><div><div class="mobile-brand"><button class="back" data-back>${icons.arrowLeft} Back</button><img class="logo-mark" src="${logo}" alt="Bi-quicker" /></div><form class="auth-card" id="authForm"><div class="form-head"><div class="role-icon ${r.theme}">${r.icon}</div><h2>${r.title} Sign In</h2></div><p class="form-sub">${r.signin}</p><div class="field"><label for="email">${key === 'admin' ? 'Admin Email' : 'Email'}</label><div class="input-wrap">${icons.mail}<input id="email" type="email" placeholder="${r.email}" autocomplete="email" /></div></div><div class="field"><div class="field-row"><label for="password">Password</label><button class="link" type="button">${key === 'admin' ? 'Contact support' : 'Forgot password?'}</button></div><div class="input-wrap">${icons.lock}<input id="password" type="password" placeholder="••••••••" autocomplete="current-password" /><button class="eye" type="button" aria-label="Show password">${icons.eye}</button></div></div>${r.security ? `<div class="security-note">${icons.admin}<span>This is a restricted area. All access attempts are logged and monitored.</span></div>` : ''}<button class="primary" type="submit">${r.button} ${icons.arrowRight}</button><div class="divider">Quick Demo</div><button class="demo" type="button" id="demoBtn">Sign in with Demo Account</button>${r.footer ? `<div class="form-footer">${r.footer} <button type="button" id="signupBtn">${r.signup}</button></div>` : `<div class="form-footer" style="font-size:7px;line-height:1.35;margin-top:13px">Admin accounts are created by system administrators only.<br/>Contact your IT department for access issues.</div>`}</form></div></div></section>`;
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => go('/')));
  const eye = document.querySelector('.eye'); const password = document.getElementById('password');
  eye.addEventListener('click', () => { const show = password.type === 'password'; password.type = show ? 'text' : 'password'; eye.innerHTML = show ? icons.eyeOff : icons.eye; });
  document.getElementById('demoBtn').addEventListener('click', () => { document.getElementById('email').value = r.email; password.value = 'demo123'; });
  document.getElementById('authForm').addEventListener('submit', e => { e.preventDefault(); const email = document.getElementById('email').value.trim(); const pass = password.value; if (!email || !pass) return alert('Please fill in all fields'); if (!email.includes('@')) return alert('Please enter a valid email'); alert('Welcome back!'); });
  const signup = document.getElementById('signupBtn'); if (signup) signup.addEventListener('click', () => go(`/${segment}/signup`));
}

function renderSignup(key, segment) {
  const r = roles[key];
  const fields = key === 'customer' ? ['Full Name','Email','Phone Number','Password','Confirm Password'] : key === 'rider' ? ['Full Name','Email','Phone Number','Vehicle Type','License Number','City','Password','Confirm Password'] : ['Owner Name','Email','Phone Number','Store Name','Store Category','Store Address','Password','Confirm Password'];
  app.innerHTML = `<section class="auth-page theme-${r.theme}"><div class="auth-shell"><div class="auth-brand"><button class="back" data-back>${icons.arrowLeft} Back to role selection</button><img class="logo-mark logo-small" src="${logo}" alt="Bi-quicker"/><div class="brand-heading"><div class="role-icon ${r.theme}">${r.icon}</div><h1>${r.title} Sign Up</h1></div><p class="brand-copy">Create your Bi-quicker account and get started.</p><div class="stats">${r.stats.map(([n,l]) => `<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join('')}</div></div><div><div class="mobile-brand"><button class="back" data-back>${icons.arrowLeft} Back</button><img class="logo-mark" src="${logo}" alt="Bi-quicker"/></div><form class="auth-card" id="signupForm"><div class="form-head"><div class="role-icon ${r.theme}">${r.icon}</div><h2>Create ${r.title} Account</h2></div><p class="form-sub">Complete the form below to continue</p>${fields.map((f,i)=>`<div class="field"><label for="f${i}">${f}</label><div class="input-wrap"><input id="f${i}" type="${f.toLowerCase().includes('password') ? 'password' : f==='Email'?'email':'text'}" placeholder="${f}" /></div></div>`).join('')}<label style="display:flex;gap:6px;align-items:center;margin-top:12px;font-size:8px"><input type="checkbox" required style="width:11px;height:11px"> I agree to the Terms of Service and Privacy Policy</label><button class="primary" type="submit">Create Account ${icons.arrowRight}</button><div class="form-footer">Already have an account? <button type="button" id="signinBtn">Sign in</button></div></form></div></div></section>`;
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => go('/')));
  document.getElementById('signinBtn').addEventListener('click', () => go(`/${segment}/signin`));
  document.getElementById('signupForm').addEventListener('submit', e => { e.preventDefault(); alert('Account created successfully!'); go(`/${segment}/signin`); });
}

window.addEventListener('hashchange', route);
route();
