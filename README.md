# Zenika-RPG

The application is available on [heroku](http://zenika-rpg.herokuapp.com/)<br />
There is a SQL script to create tables at the root of the project *database.sql*<br />
We used [Tiled](http://www.mapeditor.org/) to create the map.<br />
Winners are available with a service on [/db/winners](http://zenika-rpg.herokuapp.com/db/winners)<br />


## Installation
``` 
npm install
```

## Default database configuration
``` 
username: postgres
password: postgres
location: localhost
port: 5432
name: zenika-rpg
```
It can be changed in *server.js*

## Run
Standard with database require
``` 
npm start
```
<br />
Debug mode no database and collision area displayed
```
npm start --debug
```
<br />
Debug mode only with no database and collision area keep hide
```
npm start --no-database
```
<br />
open browser localhost:5000
