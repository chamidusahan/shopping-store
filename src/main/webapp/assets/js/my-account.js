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

function getContextPath() {
    const index = window.location.pathname.indexOf('/', 1);
    return index === -1 ? '' : window.location.pathname.substring(0, index);
}

function setInputValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.value = value && String(value).trim() ? value : '';
    }
}

async function parseJsonResponse(response) {
    const rawText = await response.text();
    return rawText.trim() ? JSON.parse(rawText) : {};
}

async function loadLoggedUser() {
    try {
        const response = await fetch(`${getContextPath()}/api/users/check-auth`, {
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

        const data = await parseJsonResponse(response);
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
        setInputValue('#addressName', data.user.addressName);
        setInputValue('#contactEmail', data.user.email);
        setInputValue('#contactMobile', data.user.mobile);
        setInputValue('#cityName', data.user.cityName);
        setInputValue('#addressLineOne', data.user.lineOne);
        setInputValue('#addressLineTwo', data.user.lineTwo);
        setInputValue('#postalCode', data.user.postalCode);

        setProfileText('#profileMobile', data.user.mobile, 'Not provided yet');
        setProfileText('#profileAddress', data.user.lineOne, 'Add your address');
        setProfileText('#profileJoinedAt', data.user.sinceAt, '--');
        setProfileText('#profileUpdatedAt', data.user.updatedAt ? `Last sign-in: ${data.user.updatedAt}` : 'Last sign-in: --', 'Last sign-in: --');

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
    setProfileText('#profileMobile', 'Not provided yet', 'Not provided yet');
    setProfileText('#profileAddress', 'Add your address', 'Add your address');
}

async function saveProfileDetails(event) {
    event.preventDefault();

    const hasSwal = typeof Swal !== 'undefined';
    const payload = {
        addressName: document.querySelector('#addressName')?.value || '',
        email: document.querySelector('#contactEmail')?.value || '',
        mobile: document.querySelector('#contactMobile')?.value || '',
        cityName: document.querySelector('#cityName')?.value || '',
        lineOne: document.querySelector('#addressLineOne')?.value || '',
        lineTwo: document.querySelector('#addressLineTwo')?.value || '',
        postalCode: document.querySelector('#postalCode')?.value || ''
    };

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

    try {
        const response = await fetch(`${getContextPath()}/api/users/profile`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await parseJsonResponse(response);

        if (!response.ok || !data.status) {
            const message = data.message || 'Profile update failed';
            if (hasSwal) {
                Swal.fire({
                    title: 'Error',
                    text: message,
                    icon: 'error',
                    position: 'top'
                });
            } else {
                alert(message);
            }
            return;
        }

        if (data.user) {
            const fullName = data.user.fullName || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
            setProfileText('#profileName', fullName, 'My Account');
            setProfileText('#profileEmail', data.user.email, 'No email available');
            setProfileText('#profileMobile', data.user.mobile, 'Not provided yet');
            setProfileText('#profileAddress', data.user.lineOne, 'Add your address');
            setProfileText('#profileJoinedAt', data.user.sinceAt, '--');
            setProfileText('#profileUpdatedAt', data.user.updatedAt ? `Last sign-in: ${data.user.updatedAt}` : 'Last sign-in: --', 'Last sign-in: --');

            setInputValue('#addressName', data.user.addressName);
            setInputValue('#contactEmail', data.user.email);
            setInputValue('#contactMobile', data.user.mobile);
            setInputValue('#cityName', data.user.cityName);
            setInputValue('#addressLineOne', data.user.lineOne);
            setInputValue('#addressLineTwo', data.user.lineTwo);
            setInputValue('#postalCode', data.user.postalCode);
        }

        if (hasSwal) {
            Swal.fire({
                title: 'SmartTrade',
                text: data.message || 'Profile updated successfully',
                icon: 'success',
                confirmButtonText: 'Okay'
            });
        } else {
            alert(data.message || 'Profile updated successfully');
        }
    } catch (error) {
        console.error('Unable to save profile details:', error);
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

// DOM එක ready ද බලලා run කරන කොටස
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLoggedUser);
} else {
    loadLoggedUser();
}

document.addEventListener('DOMContentLoaded', () => {
    const detailsForm = document.querySelector('.details-form');
    if (detailsForm) {
        detailsForm.addEventListener('submit', saveProfileDetails);
    }
});