(function () {
    function getMenuElements() {
        return {
            account: document.querySelector('[data-menu="account"]'),
            signup: document.querySelector('[data-menu="signup"]'),
            signin: document.querySelector('[data-menu="signin"]'),
            logout: document.querySelector('[data-menu="logout"]')
        };
    }

    function refreshAccountMenu(isAuthenticated) {
        const { account, signup, signin, logout } = getMenuElements();

        if (account) {
            account.style.display = isAuthenticated ? 'block' : 'none';
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
        try {
            const response = await fetch('api/users/check-auth', {
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
            refreshAccountMenu(Boolean(data.authenticated));
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
