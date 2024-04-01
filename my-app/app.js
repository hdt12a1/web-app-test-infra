const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();


app.use(bodyParser.json());


// Create a connection pool to handle multiple connections
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'database-1.cfcgy68qy30m.ap-southeast-1.rds.amazonaws.com',
    user: 'admin',
    password: 'password',
    database: 'mysql'
});

// Connect to MySQL server
pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('Connected to MySQL server');

    // Check if 'duck' database exists
    connection.query("SHOW DATABASES LIKE 'duck'", (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
            console.log("Database 'duck' does not exist");
            createDuckDatabase(connection);
        } else {
            console.log("Database 'duck' exists");
            connection.release(); // Release the connection as we won't use it further
            connectToDuckDatabase();
        }
    });
});

function createDuckDatabase(connection) {
    // Create 'duck' database
    connection.query("CREATE DATABASE duck", (err, result) => {
        if (err) throw err;
        console.log("Database 'duck' created successfully");
        
        // Close the connection
        connection.release();

        // Establish a new connection to the 'duck' database
        connectToDuckDatabase();
    });
}

function connectToDuckDatabase() {
    // Create a new connection specifically for the 'duck' database
    const duckConnection = mysql.createConnection({
        host: 'database-1.cfcgy68qy30m.ap-southeast-1.rds.amazonaws.com',
        user: 'admin',
        password: 'password',
        database: 'duck'
    });

    // Connect to 'duck' database
    duckConnection.connect((err) => {
        if (err) throw err;
        console.log('Connected to duck database');

        // Create 'tasks' table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                body VARCHAR(255)
            )
        `;
        
        duckConnection.query(createTableQuery, (err, result) => {
            if (err) throw err;
            console.log("Table 'items' created successfully");

            // Close the connection
            duckConnection.end();
        });
    });
}
// Create a connection pool to handle multiple connections
const poolDuck = mysql.createPool({
    connectionLimit: 10,
    host: 'database-1.cfcgy68qy30m.ap-southeast-1.rds.amazonaws.com',
    user: 'admin',
    password: 'password',
    database: 'duck'
});

// API routes
app.get('/api/items', (req, res) => {
    let sql = "SELECT * FROM items";
    poolDuck.query(sql, (err, results) => {
        if(err) throw err;
        res.send(apiResponse(results));
        console.log(JSON.stringify(results)); 
    });
});

app.post('/api/items', (req,res) => {
    let data = {title:req.body.title, body:req.body.body};
    let sql = "INSERT INTO items SET ?";
    poolDuck.query(sql, data, (err, results) => {
        if(err) throw err;
        res.send(apiResponse(results));
    });
});

app.get('/api/items/:id', (req, res) => {
    let sql = "SELECT * FROM items WHERE id=" + req.params.id;
    poolDuck.query(sql, (err, results) => {
        if(err) throw err;
        res.send(apiResponse(results));
    });
});

app.put('/api/items/:id', (req, res) => {
    let sql = "UPDATE items SET title=?, body=? WHERE id=?";
    let data = [req.body.title, req.body.body, req.params.id];
    poolDuck.query(sql, data, (err, results) => {
        if(err) throw err;
        res.send(apiResponse(results));
    });
});

app.delete('/api/items/:id', (req, res) => {
    let sql = "DELETE FROM items WHERE id=?";
    let data = [req.params.id];
    poolDuck.query(sql, data, (err, results) => {
        if(err) throw err;
        res.send(apiResponse(results));
    });
});




function apiResponse(results) {
    return JSON.stringify({"status":200, "error":null, "response":results});

}


app.listen(3000, () => {
    console.log('server started');
    
})


