async function signOut() {
    const hasSwal = typeof Swal !== 'undefined';

    if (hasSwal) {
        Swal.fire({
            title: 'Please wait...',
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false,
            allowEscapeKey: false,
            backdrop: true
        });
    }

    const finalize = () => {
        if (typeof window.refreshAccountMenu === 'function') {
            window.refreshAccountMenu(false);
        }
        window.location = 'sign-in.html';
    };

    try {
        const response = await fetch('api/users/logout', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            if (hasSwal) {
                Swal.fire({
                    title: 'SmartTrade',
                    text: 'Logout successful',
                    icon: 'success',
                    confirmButtonText: 'Okay'
                }).then(finalize);
            } else {
                finalize();
            }
        } else {
            if (hasSwal) {
                Swal.fire({
                    title: 'Error',
                    text: 'Something went wrong. Log Out process failed!',
                    icon: 'error',
                    position: 'top'
                });
            } else {
                alert('Something went wrong. Log Out process failed.');
            }
        }
    } catch (error) {
        if (hasSwal) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                position: 'top'
            });
        } else {
            alert(error.message);
        }
    }
}

function setProfileText(selector, value, fallback) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value && String(value).trim() ? value : fallback;
    }
}

async function loadLoggedUser() {
    try {
        // 1. URL එක root එකෙන්ම (/api) පටන් ගන්න විදිහට හැදුවා path ප්‍රශ්න නොවෙන්න

        const contextPath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));

       const response = await fetch(`${contextPath}/api/users/check-auth`, {
            method: 'GET',
            credentials: 'include', // Session cookies යවන්න මේක අනිවාර්යයි
            headers: {
                'Accept': 'application/json'
            }
        });

        // Response එක අවුල් නම් UI එක අප්ඩේට් කරනවා
        if (!response.ok) {
            console.error(`Server error: ${response.status}`);
            showFallbackUI();
            return;
        }

        // 2. Java වලින් String එකක් ආවත්, JSON ආවත් දෙකම වැඩ කරන විදිහට ආරක්ෂිතව parse කරගන්නවා
        const rawText = await response.text();
        
        if (!rawText.trim()) {
            console.error('Empty response received from server');
            showFallbackUI();
            return;
        }

        const data = JSON.parse(rawText);
        console.log("Backend Response Data:", data); // F12 Console එකෙන් දත්ත බලාගන්න

        // 3. User ලොග් වෙලා නැත්නම් හෝ දත්ත නැත්නම් fallback අගයන් පෙන්වනවා (Loading... එක අයින් කරලා)
        if (!data.authenticated || !data.user) {
            console.warn('User is not authenticated or user data is missing');
            showFallbackUI();
            return;
        }

        // 4. හැමදේම හරි නම් UI එකට Data සෙට් කරනවා
        const fullName = data.user.fullName || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
        setProfileText('#profileName', fullName, 'My Account');
        setProfileText('#profileEmail', data.user.email, 'No email available');
        
        // Set email in the form input field as well
        const emailInput = document.querySelector('#contactEmail');
        if (emailInput && data.user.email) {
            emailInput.value = data.user.email;
        }

    } catch (error) {
        // මොකක් හරි network හෝ parsing error එකක් ආවොත් loading එක අයින් කරන්න
        console.error('Unable to load logged user:', error);
        showFallbackUI();
    }
}

// දත්ත ලෝඩ් නොවුණොත් "Loading..." කියන එක දිගටම පෙන්නන්නේ නැතුව default text දාන function එකක්
function showFallbackUI() {
    setProfileText('#profileName', 'Guest User', 'My Account');
    setProfileText('#profileEmail', 'Not Signed In', 'No email available');
}

// DOM එක ready ද බලලා run කරන කොටස
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLoggedUser);
} else {
    loadLoggedUser();
}