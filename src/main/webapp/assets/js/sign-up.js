async function signUp() {

    Swal.fire({
        title: "Wait...",
        text: "Creating your account...",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); // shows spinner
        }

    });

    let firstName = document.getElementById("firstname");
    let lastName = document.getElementById("lastname");
    let email = document.getElementById("email");
    let password = document.getElementById("password");

    const user = {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        password: password.value
    }
    try {
        const response = await fetch("api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)

        });
        console.log(response)

        if (response.ok) { // 200
            const data = await response.json();
            if (data.status) {

                Swal.fire({
                    title: "Shopping Store",
                    text: data.message,
                    icon: "success",
                    confirmButtonText: "Go to Sign In"
                }).then((result) => {
                    if (result.isConfirmed) {

                        window.location = "sign-in.html";
                        // adjust the path if your sign-in route is different
                    }
                });



            } else {
                Swal.fire({

                    text: data.message,
                    icon: "error"
                });

            }
        } else {

            Swal.fire({
                title: "Something went wrong",
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