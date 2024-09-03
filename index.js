const http = require('http');
const https = require('https');

const PORT = 3000;

// This function is declared to fetch the latest stories from Time.com

function fetchStories(callback) {
    const options = {
        hostname: 'time.com',
        path: '/',
        method: 'GET',
    };

    https.get(options, (response) => {
        let data = '';

        // the data from the https is collected in the form of chunks 
        
        response.on('data', (chunk) => {
            data += chunk;
        });

        // When all data has been received then the data is parsed

        response.on('end', () => {
            const stories = [];
            const storyContainSymbol = '<li class="latest-stories__item">';
            const linkSymbol = '<a href="';
            const endlinkSymbol = '">';
            const endTitleSymbol = '</a>';

            let currentPos = 0;
            while (stories.length < 6) {
                const storyContainerPos = data.indexOf(storyContainSymbol, currentPos);
                if (storyContainerPos === -1) 
                    break;

                const linkStartPos = data.indexOf(linkSymbol, storyContainerPos) + linkSymbol.length;
                const linkEndPos = data.indexOf(endlinkSymbol, linkStartPos);
                const link = data.substring(linkStartPos, linkEndPos).trim();

                const titleStartPos = linkEndPos + endlinkSymbol.length;
                const titleEndPos = data.indexOf(endTitleSymbol, titleStartPos);
                let title = data.substring(titleStartPos, titleEndPos).trim();

                // This is done to remove extra html symbols from the output

                title = title.replace(/&#x27;/g, "'")
                             .replace(/&quot;/g, '"')
                             .replace(/&amp;/g, '&')
                             .replace(/<[^>]*>/g, '');

                stories.push({
                    title: title,
                    link: `https://time.com${link}`
                });

                currentPos = titleEndPos;
            }

            callback(null, stories);
        });

    }).on('error', (e) => {
        callback(e);
    });
}

// To create the server using the http module

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome! Use /getTimeStories to get the latest stories.');
    } else if (req.method === 'GET' && req.url === '/getTimeStories') {
      
        fetchStories((error, stories) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to retrieve stories' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(stories));
            }
        });
    } else {
        
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// To start the server

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
