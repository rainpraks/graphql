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
        console.log('loginResponse:', data)
        if (data) {
            jwtToken = data;
            document.getElementById('login').style.display = 'none';
            document.getElementById('profile').style.display = 'block';
            fetchProfileData();
            fetchXP();
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


function fetchProfileData() {
    const query = `
    query {
        user {
            id
            login
        }
    }`;

    fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(userData => {
        console.log('userData', userData);
        document.getElementById('userInfo').innerHTML = `<p>username: ${userData.data.user[0].login}</p>`;

    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchXP() {
    const query = `
    query {
        
    }`;

    fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(xpData => {
        console.log('xpData', xpData);
        // document.getElementById('xpChart').innerHTML = `<p>xpChart: ${userData.data.user[0].login}</p>`;

    })
    .catch(error => {
        console.error('Error:', error);
    });
}