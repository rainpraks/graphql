const graphqlEndpoint = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
let jwtToken = '';

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('https://01.kood.tech/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if (data) {
            jwtToken = data;
            document.getElementById('login').style.display = 'none';
            document.getElementById('profile').style.display = 'block';
            // fetchProfileData();
        } else {
            document.getElementById('loginError').innerText = 'Invalid credentials';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('loginError').innerText = 'Login failed';
    });
}

function logout() {
    jwtToken = '';
    document.getElementById('login').style.display = 'block';
    document.getElementById('profile').style.display = 'none';
}
