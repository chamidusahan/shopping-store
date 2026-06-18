
async function signIn(event) {
    
  
    if (event) event.preventDefault();

    Swal.fire({
        icon: "info",
        title: "Wait...",
        showConfirmButton: false, 
        allowOutsideClick: false
    });

    let email = document.getElementById("email");
    let password = document.getElementById("password");

    const userLoginObj = {
        email: email.value,
        password: password.value
    };

   
    const contextPath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));

    try {
      
        const response = await fetch(`${contextPath}/api/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userLoginObj)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status) {
                const targetPage = "index.html";
                
                Swal.fire({
                    toast: true,
                    icon: 'success',
                    title: 'Signed in successfully',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
               
                    window.location.href = targetPage; 
                });

            } else {
                Swal.fire({
                    text: data.message,
                    icon: "warning"
                });
            }
        } else {
            Swal.fire({
                title: "Login Failed!",
                text: "Server responded with an error (404/500)",
                icon: "error"
            });
        }

    } catch (e) {
        Swal.fire({
            text: e.message,
            icon: "error"
        });
    }
}