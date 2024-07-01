import express from 'express';
import opensearch from './opensearch.js';

let router;

console.log(`TARGET_TYPE: ${process.env.TARGET_TYPE}`);
if (process.env.TARGET_TYPE === 'opensearch') {
  router = opensearch.router;
};

const app = express();
app.use(express.json());
app.use(router);
app.listen(3000, () => {
  console.log('Forwarding server listening on port 3000');
});
