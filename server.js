'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

client.on('error', err => {
    throw new Error(err);
});

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}

////////////
app.get('/', (request, response) => {
    response.send('The Home Page..');
});
app.get('/location', locationHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);
/////////

function locationHandler(request, response) {
    const city = request.query.city;
    const theDatabaseQuery = 'SELECT search_query, formatted_query, latitude, longitude FROM locations WHERE search_query LIKE $1'
    client.query(theDatabaseQuery, [city]).then((result) => {
        if (result.rows.length > 0) {
            response.status(200).json(result.rows[0]);
            
        } else {
            superagent(
                `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`
                ).then((res) => {
                    const geoData = res.body;
                    const theLocation = new Location(city, geoData);
                    const SQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *';
                    const theResults = [theLocation.search_query, theLocation.formatted_query, theLocation.latitude, theLocation.longitude];
                    client.query(SQL, theResults).then(result => {
                        response.status(200).json(theLocation);
                    }).catch(err => {
                        response.status(500).send(err);
                    })
                }).catch((err) => {
                    errorHandler(err, request, response);
                });
            }
        });
    }

////////////
    
    function notFoundHandler(request, response) {
        response.status(404).send('Error, Status: 404');
    }
    function errorHandler(error, request, response) {
        response.status(500).send(error);
    }
    
    
    client.connect().then(() => {
        app.listen(PORT, () => 
            console.log(`My server is up and running on ${PORT}`)
            );   
        })
        .catch(err => {
        throw new Error(`Startup Error: ${err}`);
    })
