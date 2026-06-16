import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Ashwi\\.gemini\\antigravity\\brain\\eb2bb51b-a97a-4b07-b28d-19ef7b2c928c\\.system_generated\\steps\\14\\content.md', 'utf-8');

// The pattern could be "latitude":...,"longitude":...
const regex = /"latitude":([0-9.]+),"longitude":([0-9.]+)/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
    count++;
}
console.log(`Found ${count} latitude/longitude pairs.`);

// Let's also look for "lat":...,"lng":...
const regex2 = /"lat":([0-9.]+),"lng":([0-9.]+)/g;
let count2 = 0;
while ((match = regex2.exec(content)) !== null) {
    count2++;
}
console.log(`Found ${count2} lat/lng pairs.`);

// Let's look for "city_id"
const cityRegex = /"city_id":([0-9]+)/g;
let count3 = 0;
while ((match = cityRegex.exec(content)) !== null) {
    count3++;
}
console.log(`Found ${count3} city_id.`);

// Let's look for anything that looks like a station object.
const objRegex = /\{[^{}]*?"latitude"[^{}]*?\}/g;
let count4 = 0;
const objs = [];
while ((match = objRegex.exec(content)) !== null) {
    count4++;
    if (count4 < 5) objs.push(match[0]);
}
console.log(`Found ${count4} objects containing 'latitude'. First few:`, objs);

