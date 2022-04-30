#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('morgan');
const http = require('http');
const nunjucks = require('nunjucks');

const port = 3000;

const displayRoot = path.join(__dirname, 'displays');

const app = express();
app.set('view engine', 'html');
app.set('port', port);

nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    noCache: true,
    watch: false,
});

app.use(logger('dev'));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/raw', express.static(displayRoot));
app.use('/dist', express.static(path.join(__dirname, '../dist')));

app.get('/', async (req, res) => {
    res.render('index', {
        tree: await listDisplays(displayRoot),
    });
});

app.get('/folders/:folder(*)?', async (req, res) => {
    const folderPath = path.join(displayRoot, req.params.folder);
    res.render('folder', {
        parentUrl: getParentUrl(folderPath),
        tree: await listDisplays(folderPath),
    });
});

function getParentUrl(item) {
    if (displayRoot === item) {
        return;
    }
    const rel = path.relative(displayRoot, path.dirname(item));
    return '/folders/' + rel;
}

app.get('/displays/:display(*)?', async (req, res) => {
    const displayPath = path.join(displayRoot, req.params.display);
    const folderPath = path.dirname(displayPath);
    res.render('display', {
        parentUrl: getParentUrl(folderPath),
        tree: await listDisplays(folderPath),
        displayHref: `/raw/${req.params.display}`,
    });
});

const server = http.createServer(app);
server.listen(port, () => console.log(`Demo server listening on port ${port}`));

async function listDisplays(parentFolder) {
    const folders = [];
    const files = [];
    const items = await fs.promises.readdir(parentFolder);
    for (let i = 0; i < items.length; i++) {
        const itemPath = path.join(parentFolder, items[i]);
        const fstat = await fs.promises.stat(itemPath);
        if (fstat.isDirectory()) {
            folders.push({
                name: items[i],
                location: path.relative(displayRoot, itemPath),
            });
        } else if (items[i].endsWith('.opi')) {
            files.push({
                name: items[i],
                location: path.relative(displayRoot, itemPath),
            });
        }
    }
    return { folders, files };
}
