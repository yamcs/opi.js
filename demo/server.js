#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('morgan');
const http = require('http');
const nunjucks = require('nunjucks');

const port = 3000;

const displayDirectory = path.join(__dirname, 'displays');

const app = express();
app.set('view engine', 'html');
app.set('port', port);

nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    noCache: true,
    watch: true,
});

app.use(logger('dev'));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/raw', express.static(displayDirectory));
app.use('/dist', express.static(path.join(__dirname, '../dist')));

app.get('/', (req, res) => res.redirect('/displays'));

app.get('/displays', async (req, res) => {
    res.render('index', {
        displays: await listDisplays()
    });
});

app.get('/displays/:display(*)?', async (req, res) => {
    res.render('display', {
        displays: await listDisplays(),
        display: req.params.display
    });
});

const server = http.createServer(app);
server.listen(port, () => console.log(`Demo server listening on port ${port}`));

async function listDisplays() {
    const dirs = [];
    const files = [];
    const items = await fs.promises.readdir(displayDirectory);
    for (let i = 0; i < items.length; i++) {
        const fstat = await fs.promises.stat(path.join(displayDirectory, items[i]));
        if (fstat.isDirectory()) {
            dirs.push({
                name: items[i],
            });
        } else if (items[i].endsWith('.opi')) {
            files.push({ name: items[i] });
        }
    }
    return { dirs, files };
}
