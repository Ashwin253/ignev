import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Ashwi\\.gemini\\antigravity\\brain\\eb2bb51b-a97a-4b07-b28d-19ef7b2c928c\\.system_generated\\steps\\14\\content.md', 'utf-8');

const stationRegex2 = /\\"name\\":\\"(.*?)\\",\\"lat(?:itude)?\\":([0-9.]+),\\"long(?:itude)?\\":([0-9.]+)/g;
let match;
let count = 0;
while ((match = stationRegex2.exec(content)) !== null) {
    count++;
}
console.log(`Found ${count} with regex2.`);

const stationRegex3 = /\\"station_name\\":\\"(.*?)\\",\\"lat(?:itude)?\\":([0-9.]+),\\"long(?:itude)?\\":([0-9.]+)/g;
count = 0;
while ((match = stationRegex3.exec(content)) !== null) {
    count++;
}
console.log(`Found ${count} with regex3.`);

const stationTitleRegex = /class="[^"]*station-map__card-title[^"]*">([^<]+)<\/span>/g;
count = 0;
const titles = [];
while ((match = stationTitleRegex.exec(content)) !== null) {
    count++;
    titles.push(match[1]);
}
console.log(`Found ${count} titles in HTML: `, titles.slice(0, 5));

