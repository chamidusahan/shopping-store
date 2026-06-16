async function signIn() {
    console.log("wadada bn")
    Swal.fire({
        icon: "info",
        title: "Wait...",

    });

    let email = document.getElementById("email");
    let password = document.getElementById("password");

    const userLoginObj = {
        email: email.value,
        password: password.value
    }

    try {
          const response = await fetch("api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userLoginObj)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status) {
                Swal.fire({
                    toast: true,
                    icon: 'success',
                    title: 'Signed in successfully',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    window.location = "index.html";
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
                    text: "Please try again",
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
