function getContextPath() {
    const index = window.location.pathname.indexOf('/', 1);
    return index === -1 ? '' : window.location.pathname.substring(0, index);
}

async function parseJsonResponse(response) {
    const rawText = await response.text();
    return rawText.trim() ? JSON.parse(rawText) : {};
}

function signOut() {
    fetch(`${getContextPath()}/api/users/logout`, {
        method: 'GET',
        credentials: 'include'
    }).then((response) => {
        if (response.ok) {
            window.location = 'sign-in.html';
        } else {
            alert('Logout failed.');
        }
    }).catch((error) => {
        alert(error.message);
    });
}

async function loadAdminProfile() {
    try {
        const response = await fetch(`${getContextPath()}/api/users/check-auth`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            window.location = 'sign-in.html';
            return;
        }

        const data = await parseJsonResponse(response);

        if (!data.authenticated || !data.user) {
            window.location = 'sign-in.html';
            return;
        }

        const userRole = String(data.user.role || '').trim().toUpperCase();

        if (userRole !== 'ADMIN') {
            window.location = 'index.html';
            return;
        }

        const fullName = data.user.fullName || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
        const identity = document.getElementById('adminIdentity');
        if (identity) {
            identity.textContent = `${fullName || 'Admin'} · ${data.user.email || 'No email available'}`;
        }
    } catch (error) {
        window.location = 'sign-in.html';
    }
}

loadAdminProfile();