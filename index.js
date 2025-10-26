const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');
const { XMLBuilder } = require('fast-xml-parser');

program
	.requiredOption('-i, --input <path>', 'path to input file')
	.requiredOption('-h, --host <address>', 'host address')
	.requiredOption('-p, --port <number>', 'server port')

program.parse();
const options = program.opts();

const origin = `http://${options.host}:${options.port}`

if (!fs.existsSync(options.input)) {
	console.error('Cannot find input file');
	process.exit(1);
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url, origin);
	const params = new URLSearchParams(url.search);

	fs.readFile(options.input, 'utf8', (err, rawData) =>{
		if (err) {
			console.error(`Error reading file: ${err}`);
			process.exit(1);
		};

		let data = rawData
			.split('\n')
			.filter(line => line.trim().length > 0)
			.map(line => JSON.parse(line));

		if (params.has('variety')) {
			data = data.map(item => ({
				'petal.length': item['petal.length'],
				'petal.width': item['petal.width'],
				'variety': item.variety,
			}));
		} else {
			data = data.map(item => ({
				'petal.length': item['petal.length'],
				'petal.width': item['petal.width'],
			}));
		};

		if (params.has('min_petal_length')) {
			const minLength = parseFloat(params.get('min_petal_length'));
			data = data.filter(
				item => item['petal.length'] > minLength
			);
		};

		const nestedData = {
			irises: {
				flower: data
			}
		};

		const builder = new XMLBuilder({
			format: true,
			indentBy: "  ",
		});
		const xmlContent = builder.build(nestedData);

		res.writeHead(200, { 'Content-Type': 'application/xml' });
		res.end(xmlContent);
	});
});

server.listen(options.port, options.host, () => {
	console.log(
		`Server running at ${origin}/`
	);
});
