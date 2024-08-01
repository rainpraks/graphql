const graphqlEndpoint = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
let jwtToken = '';

document.addEventListener('DOMContentLoaded', (event) => {
    jwtToken = Cookies.get('jwtToken');
    if (jwtToken) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('profile').style.display = 'block';
        fetchProfileData();
    }
});

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('https://01.kood.tech/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
    })

    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        return response.json();
    })
    .then(data => {
        console.log('loginResponse:', data)
        if (data) {
            jwtToken = data;
            Cookies.set('jwtToken', jwtToken, {expires: 1 });
            document.getElementById('login').style.display = 'none';
            document.getElementById('profile').style.display = 'block';
            fetchProfileData();
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
    Cookies.remove('jwtToken');
    document.getElementById('login').style.display = 'block';
    document.getElementById('profile').style.display = 'none';
}

function fetchProfileData() {
    jwtToken = Cookies.get('jwtToken');

    if (!jwtToken) {
        document.getElementById('loginError').innerText = 'Please login again';
        return
    }

    const query = `
    query {
        user {
            id
            login
            createdAt
            auditRatio
            campus
            email
            firstName
            lastName
            totalUp
            totalDown
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
        fetchXP();
        fetchPassFail(userData.data.user[0].id);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchXP() {
    const query = `
    {
        transaction(
            where: {type: {_eq: "xp"}, object: {type: {_eq: "project"}}},
            order_by: {createdAt: desc},
            ) {
                amount
                object {
                name
                }
                createdAt
                user { # Nested query to get user details
                id
                login
                email
                firstName
                lastName
            }
        }
    }
    `;


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
        renderXPChart(xpData);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchPassFail(userId) {
    const query = `
    query GetPassFailRatio($userId: Int!) {
        progress(
            where: { userId: { _eq: $userId } },
            order_by: { createdAt: desc }
        ) {
            grade
        }
    }
    `;

    fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ query, variables: { userId } })
    })
    .then(response => response.json())
    .then(passFail => {
        console.log('passFail', passFail);
        renderPassFailChart(passFail);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function renderXPChart(xpData) {
    // Clear previous chart if any
    d3.select("#xpChart").selectAll("*").remove();

    // Set up the SVG container dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#xpChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare the data
    const data = xpData.data.transaction.map(d => ({
        name: d.object.name,
        amount: d.amount
    }));

    // Create scales for the X and Y axes
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.amount)])
        .nice()
        .range([height, 0]);

    // Add bars to the chart
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.amount))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.amount))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this).style("fill", "orange");
            // Tooltip logic here
        })
        .on("mouseout", function() {
            d3.select(this).style("fill", "steelblue");
        });

    // Add the X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add the Y Axis with custom tick format
    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(",.0f")));
}

function renderPassFailChart(progressData) {
    const passFailCounts = {
        pass: progressData.filter(d => d.grade === 1).length,
        fail: progressData.filter(d => d.grade === 0).length
    };

    const svg = d3.select("#ratioChart").append("svg")
        .attr("width", 300)
        .attr("height", 300)
        .append("g")
        .attr("transform", "translate(150,150)");

    const radius = 150;

    const pie = d3.pie()
        .value(d => d.value);

    const data_ready = pie(d3.entries(passFailCounts));

    const arc = d3.arc()
        .innerRadius(50)
        .outerRadius(radius);

    svg.selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => i === 0 ? "green" : "red")
        .each(function(d) { this._current = d; }) // store the initial angles

    svg.selectAll('text')
        .data(data_ready)
        .enter()
        .append('text')
        .text(d => `${d.data.key}: ${d.data.value}`)
        .attr("transform", d => "translate(" + arc.centroid(d) + ")")
        .style("text-anchor", "middle")
        .style("font-size", 15);
}

function renderPassFailChart(passFailData) {
    const grades = passFailData.data.progress;
    const passFailCounts = {
        pass: grades.filter(d => d.grade === 1).length,
        fail: grades.filter(d => d.grade === 0).length
    };

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    // Clear previous chart if any
    d3.select("#ratioChart").selectAll("*").remove();

    const svg = d3.select("#ratioChart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(["pass", "fail"])
        .range(["green", "red"]);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const data_ready = pie(Object.entries(passFailCounts).map(([key, value]) => ({ key, value })));

    const arc = d3.arc()
        .innerRadius(50)
        .outerRadius(radius);

    svg.selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.key))
        .each(function(d) { this._current = d; });

    svg.selectAll('text')
        .data(data_ready)
        .enter()
        .append('text')
        .text(d => `${d.data.key}: ${d.data.value}`)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", 15);
}
