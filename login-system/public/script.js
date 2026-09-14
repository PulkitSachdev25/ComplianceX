// State & Elements
const tabs = document.querySelectorAll('.tab-btn');
const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    demo: document.getElementById('demo-pane')
};
const alertBanner = document.getElementById('alert-banner');
const successModal = document.getElementById('success-modal');

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        Object.values(forms).forEach(f => f.classList.remove('active'));

        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        if (forms[target]) {
            forms[target].classList.add('active');
        }
        hideAlert();
    });
});

function showAlert(message, type = 'error') {
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner ${type}`;
}

function hideAlert() {
    alertBanner.className = 'alert-banner hidden';
    alertBanner.textContent = '';
}

function setBtnLoading(btn, isLoading) {
    const textSpan = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    if (isLoading) {
        btn.disabled = true;
        textSpan.style.opacity = '0.5';
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        textSpan.style.opacity = '1';
        spinner.classList.add('hidden');
    }
}

// Toggle password visibility buttons
document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = 'Hide';
        } else {
            input.type = 'password';
            btn.textContent = 'Show';
        }
    });
});

// Show success launchpad modal
function showModal(user, token) {
    document.getElementById('modal-user-name').textContent = user.name || 'Officer';
    document.getElementById('modal-user-role').textContent = user.role || 'Legal Metrology Officer';
    document.getElementById('modal-user-badge').textContent = user.badgeNumber || 'LM-AUTH-2026';
    document.getElementById('modal-user-jurisdiction').textContent = user.jurisdiction || 'Delhi Central';
    document.getElementById('modal-user-token').textContent = `Bearer ${token.slice(0, 18)}...`;

    successModal.classList.remove('hidden');
}

// 1. Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');

    setBtnLoading(btn, true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || 'Authentication failed. Please verify your credentials.', 'error');
            setBtnLoading(btn, false);
            return;
        }

        showAlert('Authentication verified. Establishing statutory session...', 'success');
        localStorage.setItem('lmpc_token', data.token);
        localStorage.setItem('lmpc_user', JSON.stringify(data.user));

        setTimeout(() => {
            showModal(data.user, data.token);
            setBtnLoading(btn, false);
        }, 500);

    } catch (err) {
        showAlert('Network or server connection failed. Ensure the LMPC auth backend is running on port 5001.', 'error');
        setBtnLoading(btn, false);
    }
});

// 2. Handle Registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const role = document.getElementById('reg-role').value;
    const jurisdiction = document.getElementById('reg-jurisdiction').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('reg-submit-btn');

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'error');
        return;
    }

    setBtnLoading(btn, true);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, jurisdiction })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || 'Account registration failed.', 'error');
            setBtnLoading(btn, false);
            return;
        }

        showAlert('Officer account registered successfully! Initializing credentials...', 'success');
        localStorage.setItem('lmpc_token', data.token);
        localStorage.setItem('lmpc_user', JSON.stringify(data.user));

        setTimeout(() => {
            showModal(data.user, data.token);
            setBtnLoading(btn, false);
        }, 600);

    } catch (err) {
        showAlert('Connection to server failed. Please try again.', 'error');
        setBtnLoading(btn, false);
    }
});

// 3. Handle 1-Click Instant Demo Cards
document.querySelectorAll('.demo-card').forEach(card => {
    card.addEventListener('click', async () => {
        const email = card.getAttribute('data-email');
        const password = card.getAttribute('data-password');

        // Switch back to login form & fill
        tabs[0].click();
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;

        showAlert(`Autofilled credentials for ${email}. Authenticating...`, 'success');

        const btn = document.getElementById('login-submit-btn');
        setBtnLoading(btn, true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('lmpc_token', data.token);
                localStorage.setItem('lmpc_user', JSON.stringify(data.user));
                setTimeout(() => {
                    showModal(data.user, data.token);
                    setBtnLoading(btn, false);
                }, 400);
            } else {
                showAlert(data.error || 'Authentication error', 'error');
                setBtnLoading(btn, false);
            }
        } catch (err) {
            showAlert('Connection error while logging in.', 'error');
            setBtnLoading(btn, false);
        }
    });
});

// Modal Actions
document.getElementById('btn-launch-app').addEventListener('click', () => {
    // Launch main application console
    const targetUrl = 'http://localhost:5174';
    window.location.href = targetUrl;
});

document.getElementById('btn-dismiss-modal').addEventListener('click', () => {
    successModal.classList.add('hidden');
    showAlert('Session saved in local storage. You can access LMPC Vision anytime.', 'success');
});
