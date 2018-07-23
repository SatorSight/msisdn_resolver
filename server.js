const http = require('http');
const url = require('url');

const test = require('./resolver');

const hostname = '127.0.0.1';
const port = 3005;

const answer = (msisdn, service_id) => test.getSubscriptionInfo(msisdn, service_id);

const server = http.createServer((req, res) => {
	const query = url.parse(req.url, true).query;
	if(!query.msisdn || !query.service_id){
		res.statusCode = 400;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({
			error: 'Wrong parameters',
		}));
	}else{
		answer(query.msisdn, query.service_id).then(resp => {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resp));
		});
	}
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});