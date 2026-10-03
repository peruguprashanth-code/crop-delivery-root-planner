
// ==========================================
// CROP DELIVERY ROUTE PLANNER
// ==========================================


// ------------------------------------------
// LOCATION DATA
// ------------------------------------------

const locations = {

    "Farm A": {
        lat: 17.3850,
        lng: 78.4867,
        type: "farm"
    },

    "Farm B": {
        lat: 17.4000,
        lng: 78.5000,
        type: "farm"
    },

    "Farm C": {
        lat: 17.3700,
        lng: 78.4750,
        type: "farm"
    },

    "Market X": {
        lat: 17.3950,
        lng: 78.5200,
        type: "market"
    },

    "Market Y": {
        lat: 17.3600,
        lng: 78.5100,
        type: "market"
    }
};


// ------------------------------------------
// GRAPH
// ------------------------------------------

// Distance in kilometres

const graph = {

    "Farm A": {
        "Farm B": 10,
        "Farm C": 5
    },

    "Farm B": {
        "Farm A": 10,
        "Farm C": 3,
        "Market X": 4,
        "Market Y": 8
    },

    "Farm C": {
        "Farm A": 5,
        "Farm B": 3,
        "Market X": 8,
        "Market Y": 6
    },

    "Market X": {
        "Farm B": 4,
        "Farm C": 8,
        "Market Y": 6
    },

    "Market Y": {
        "Farm B": 8,
        "Farm C": 6,
        "Market X": 6
    }
};


// ------------------------------------------
// CREATE MAP
// ------------------------------------------

const map = L.map("map").setView(
    [17.3850, 78.4867],
    13
);


// OpenStreetMap tiles

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// ------------------------------------------
// MARKERS
// ------------------------------------------

const markers = {};


for (const name in locations) {

    const location = locations[name];

    const iconColor =
        location.type === "farm"
            ? "green"
            : "red";


    const marker = L.circleMarker(
        [location.lat, location.lng],
        {
            radius: 9,
            color: iconColor,
            fillColor: iconColor,
            fillOpacity: 0.8
        }
    ).addTo(map);


    marker.bindPopup(
        `<b>${name}</b><br>
         Type: ${location.type}`
    );


    markers[name] = marker;
}


// ------------------------------------------
// DRAW ALL ROADS
// ------------------------------------------

const roadLines = [];


for (const start in graph) {

    for (const end in graph[start]) {

        // Prevent duplicate roads

        if (
            !roadLines.some(
                road =>
                    road.start === end &&
                    road.end === start
            )
        ) {

            const line = L.polyline(
                [
                    [
                        locations[start].lat,
                        locations[start].lng
                    ],
                    [
                        locations[end].lat,
                        locations[end].lng
                    ]
                ],
                {
                    color: "#999",
                    weight: 2,
                    dashArray: "5,5"
                }
            ).addTo(map);


            roadLines.push({
                start: start,
                end: end,
                line: line
            });
        }
    }
}


// ------------------------------------------
// DIJKSTRA ALGORITHM
// ------------------------------------------

function dijkstra(start, destination) {

    const distances = {};
    const previous = {};
    const unvisited = new Set(
        Object.keys(graph)
    );


    for (const node of Object.keys(graph)) {

        distances[node] = Infinity;
        previous[node] = null;
    }


    distances[start] = 0;


    while (unvisited.size > 0) {

        let current = null;
        let smallestDistance = Infinity;


        // Find smallest distance

        for (const node of unvisited) {

            if (
                distances[node] <
                smallestDistance
            ) {

                smallestDistance =
                    distances[node];

                current = node;
            }
        }


        if (current === null) {
            break;
        }


        unvisited.delete(current);


        if (current === destination) {
            break;
        }


        // Update neighbors

        for (const neighbor in graph[current]) {

            if (!unvisited.has(neighbor)) {
                continue;
            }


            const newDistance =
                distances[current] +
                graph[current][neighbor];


            if (
                newDistance <
                distances[neighbor]
            ) {

                distances[neighbor] =
                    newDistance;

                previous[neighbor] =
                    current;
            }
        }
    }


    // Build path

    const path = [];

    let current = destination;


    while (current !== null) {

        path.unshift(current);

        current = previous[current];
    }


    if (path[0] !== start) {

        return {
            path: [],
            distance: Infinity
        };
    }


    return {
        path: path,
        distance: distances[destination]
    };
}


// ------------------------------------------
// GREEDY ALGORITHM
// ------------------------------------------

function greedy(start, destination) {

    const visited = new Set();

    const path = [start];

    let current = start;

    let totalDistance = 0;


    visited.add(start);


    while (current !== destination) {

        let nearest = null;
        let nearestDistance = Infinity;


        for (const neighbor in graph[current]) {

            if (visited.has(neighbor)) {
                continue;
            }


            if (
                graph[current][neighbor] <
                nearestDistance
            ) {

                nearest = neighbor;

                nearestDistance =
                    graph[current][neighbor];
            }
        }


        if (nearest === null) {
            break;
        }


        visited.add(nearest);

        path.push(nearest);

        totalDistance += nearestDistance;

        current = nearest;
    }


    return {
        path: path,
        distance: totalDistance
    };
}


// ------------------------------------------
// TSP ALGORITHM
// ------------------------------------------

function permutations(array) {

    if (array.length === 0) {
        return [[]];
    }


    const result = [];


    for (let i = 0; i < array.length; i++) {

        const current = array[i];

        const remaining =
            array.slice(0, i)
                .concat(array.slice(i + 1));


        const remainingPermutations =
            permutations(remaining);


        for (
            const permutation
            of remainingPermutations
        ) {

            result.push(
                [current].concat(permutation)
            );
        }
    }


    return result;
}


function tsp(start, destination) {

    // Locations that should be visited

    const requiredLocations = [
        "Farm A",
        "Farm B",
        "Farm C",
        destination
    ];


    // Remove duplicate start

    const otherLocations =
        requiredLocations.filter(
            node => node !== start
        );


    const allPermutations =
        permutations(otherLocations);


    let bestPath = null;

    let bestDistance = Infinity;


    for (
        const permutation
        of allPermutations
    ) {

        const path =
            [start].concat(permutation);


        let distance = 0;

        let valid = true;


        for (
            let i = 0;
            i < path.length - 1;
            i++
        ) {

            const from = path[i];

            const to = path[i + 1];


            if (
                !graph[from] ||
                graph[from][to] === undefined
            ) {

                valid = false;
                break;
            }


            distance += graph[from][to];
        }


        // Return to starting location

        if (
            valid &&
            graph[path[path.length - 1]] &&
            graph[path[path.length - 1]][start] !== undefined
        ) {

            distance +=
                graph[path[path.length - 1]][start];


            if (distance < bestDistance) {

                bestDistance = distance;

                bestPath =
                    path.concat(start);
            }
        }
    }


    return {
        path: bestPath || [],
        distance: bestDistance
    };
}


// ------------------------------------------
// CALCULATE ROUTE
// ------------------------------------------

function calculateRoute() {

    const start =
        document.getElementById("start").value;


    const destination =
        document.getElementById("destination").value;


    const algorithm =
        document.getElementById("algorithm").value;


    const costPerKm =
        Number(
            document.getElementById("cost").value
        );


    let result;


    // Run selected algorithm

    if (algorithm === "dijkstra") {

        result =
            dijkstra(start, destination);

    }

    else if (algorithm === "greedy") {

        result =
            greedy(start, destination);

    }

    else {

        result =
            tsp(start, destination);
    }


    // Display result

    displayResult(
        algorithm,
        result,
        costPerKm
    );


    // Draw route

    drawRoute(result.path);


    // Compare algorithms

    compareAlgorithms(
        start,
        destination,
        costPerKm
    );
}


// ------------------------------------------
// DISPLAY RESULT
// ------------------------------------------

function displayResult(
    algorithm,
    result,
    costPerKm
) {

    const algorithmNames = {

        dijkstra: "Dijkstra",

        greedy: "Greedy",

        tsp: "TSP"
    };


    document.getElementById(
        "resultAlgorithm"
    ).textContent =
        algorithmNames[algorithm];


    document.getElementById(
        "resultRoute"
    ).textContent =
        result.path.length > 0
            ? result.path.join(" → ")
            : "No route found";


    document.getElementById(
        "resultDistance"
    ).textContent =
        result.distance === Infinity
            ? "N/A"
            : result.distance + " km";


    document.getElementById(
        "resultCost"
    ).textContent =
        result.distance === Infinity
            ? "N/A"
            : "₹" +
            (result.distance * costPerKm);


    document.getElementById(
        "resultLocations"
    ).textContent =
        result.path.length;


    // Decision explanation

    const decisionList =
        document.getElementById(
            "decisionList"
        );


    decisionList.innerHTML = "";


    if (algorithm === "dijkstra") {

        addDecision(
            "Started from " +
            result.path[0]
        );

        addDecision(
            "Selected the lowest-cost path at each step."
        );

        addDecision(
            "Calculated the shortest route to " +
            result.path[result.path.length - 1]
        );

    }

    else if (algorithm === "greedy") {

        addDecision(
            "Started from " +
            result.path[0]
        );

        addDecision(
            "Selected the nearest unvisited location."
        );

        addDecision(
            "Repeated the local choice until reaching the destination."
        );

    }

    else {

        addDecision(
            "Generated possible visiting orders."
        );

        addDecision(
            "Calculated the total cost of each valid tour."
        );

        addDecision(
            "Selected the lowest-cost valid tour."
        );
    }
}


function addDecision(text) {

    const li =
        document.createElement("li");

    li.textContent = text;

    document.getElementById(
        "decisionList"
    ).appendChild(li);
}


// ------------------------------------------
// DRAW SELECTED ROUTE
// ------------------------------------------

let selectedRoute = null;


function drawRoute(path) {

    // Remove previous route

    if (selectedRoute) {

        map.removeLayer(selectedRoute);
    }


    if (!path || path.length < 2) {
        return;
    }


    const coordinates =
        path.map(
            node => [
                locations[node].lat,
                locations[node].lng
            ]
        );


    selectedRoute =
        L.polyline(
            coordinates,
            {
                color: "#176b3a",
                weight: 6
            }
        ).addTo(map);


    // Zoom map

    map.fitBounds(
        selectedRoute.getBounds(),
        {
            padding: [30, 30]
        }
    );
}


// ------------------------------------------
// COMPARE ALL ALGORITHMS
// ------------------------------------------

function compareAlgorithms(
    start,
    destination,
    costPerKm
) {

    const dijkstraResult =
        dijkstra(
            start,
            destination
        );


    const greedyResult =
        greedy(
            start,
            destination
        );


    const tspResult =
        tsp(
            start,
            destination
        );


    const results = [

        {
            name: "Dijkstra",
            result: dijkstraResult
        },

        {
            name: "Greedy",
            result: greedyResult
        },

        {
            name: "TSP",
            result: tspResult
        }

    ];


    const tbody =
        document.getElementById(
            "comparisonBody"
        );


    tbody.innerHTML = "";


    results.forEach(item => {

        const row =
            document.createElement("tr");


        const route =
            item.result.path.length > 0
                ? item.result.path.join(" → ")
                : "No route";


        const distance =
            item.result.distance === Infinity
                ? "N/A"
                : item.result.distance + " km";


        const cost =
            item.result.distance === Infinity
                ? "N/A"
                : "₹" +
                (
                    item.result.distance *
                    costPerKm
                );


        row.innerHTML = `

            <td>
                <strong>${item.name}</strong>
            </td>

            <td>${route}</td>

            <td>${distance}</td>

            <td>${cost}</td>

        `;


        tbody.appendChild(row);

    });
}


// ------------------------------------------
// INITIAL RESULT
// ------------------------------------------

calculateRoute();

