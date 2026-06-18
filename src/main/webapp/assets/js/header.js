(function () {
    function getMenuElements() {
        return {
            account: document.querySelector('[data-menu="account"]'),
            admin: document.querySelector('[data-menu="admin"]'),
            signup: document.querySelector('[data-menu="signup"]'),
            signin: document.querySelector('[data-menu="signin"]'),
            logout: document.querySelector('[data-menu="logout"]')
        };
    }

    function refreshAccountMenu(isAuthenticated, role) {
        const { account, admin, signup, signin, logout } = getMenuElements();
        const isAdmin = isAuthenticated && role === 'ADMIN';

        if (account) {
            account.style.display = isAuthenticated ? 'block' : 'none';
        }
        if (admin) {
            admin.style.display = isAdmin ? 'block' : 'none';
        }
        if (logout) {
            logout.style.display = isAuthenticated ? 'block' : 'none';
        }
        if (signup) {
            signup.style.display = isAuthenticated ? 'none' : 'block';
        }
        if (signin) {
            signin.style.display = isAuthenticated ? 'none' : 'block';
        }
    }

    async function checkAuthenticationStatus() {
        // 1. 👈 Context Path එක dynamic විදිහට ගන්නවා (404 එක නැතිවෙන්න)
        const index = window.location.pathname.indexOf('/', 1);
        const contextPath = index === -1 ? '' : window.location.pathname.substring(0, index);

        try {
            // URL එකට contextPath එක එකතු කළා
            const response = await fetch(`${contextPath}/api/users/check-auth`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                refreshAccountMenu(false);
                return;
            }

            const data = await response.json();

            // 2. 👈 ඩේටාබේස් එකෙන් එන Role එක මොන වගේ ආවත් (.toUpperCase()) කරලා සසඳනවා
            const userRole = data.user && data.user.role ? data.user.role.toUpperCase() : null;

            // නිවැරදි කරන ලද role එක refreshAccountMenu එකට පාස් කරනවා
            refreshAccountMenu(Boolean(data.authenticated), userRole);

        } catch (error) {
            console.error('Unable to verify authentication status', error);
            refreshAccountMenu(false);
        }
    }

    function initializeHeader() {
        const navToggle = document.getElementById('navToggle');
        const navElement = document.querySelector('header nav');
        const accountToggle = document.getElementById('accountToggle');
        const accountWrapper = document.getElementById('accountMenuWrapper');
        const navLinks = document.querySelectorAll('#primaryNav a');
        const logoutLink = document.querySelector('[data-menu="logout"]');

        if (!navElement) {
            return;
        }

        if (navToggle) {
            navToggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                const isOpen = navElement.classList.toggle('nav-open');
                navToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        if (accountToggle && accountWrapper) {
            accountToggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                const isOpen = accountWrapper.classList.toggle('open');
                accountToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (navElement && navToggle) {
                    navElement.classList.remove('nav-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        if (logoutLink) {
            logoutLink.addEventListener('click', function (event) {
                event.preventDefault();
                if (typeof window.signOut === 'function') {
                    window.signOut();
                } else {
                    window.location = 'sign-in.html';
                }
            });
        }

        if (window.__headerDocumentHandler) {
            document.removeEventListener('click', window.__headerDocumentHandler);
        }

        window.__headerDocumentHandler = function (event) {
            if (accountWrapper && !accountWrapper.contains(event.target)) {
                accountWrapper.classList.remove('open');
                if (accountToggle) {
                    accountToggle.setAttribute('aria-expanded', 'false');
                }
            }

            if (navElement && !navElement.contains(event.target)) {
                navElement.classList.remove('nav-open');
                if (navToggle) {
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            }
        };

        document.addEventListener('click', window.__headerDocumentHandler);

        checkAuthenticationStatus();
    }

    window.initializeHeader = initializeHeader;
    window.refreshAccountMenu = refreshAccountMenu;
})();
