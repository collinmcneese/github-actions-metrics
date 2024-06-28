// express API to forward GitHub webhooks to OpenSearch
import express from 'express';
const router = express.Router();
import { Client } from '@opensearch-project/opensearch';

// Set the host, protocol, port, and auth for the OpenSearch client
// See documentation for the OpenSearch client for more information to configure different options
// https://github.com/opensearch-project/opensearch-js
const host = `${process.env.OPENSEARCH_HOST}`;
const protocol = `${process.env.OPENSEARCH_PROTOCOL}`;
const port = `${process.env.OPENSEARCH_PORT}`;
const auth = `${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}`;

// Forward the GitHub webhook to OpenSearch
const client = new Client({
  nodes: `${protocol}://${auth}@${host}:${port}`.replace(/"/g, ''),
  ssl: {
    rejectUnauthorized: false
  }
});

router.get('/', (req, res) => {
  res.send('Server is running');
});

router.post('/', async (req, res) => {
  try {
    const id = req.headers['x-github-delivery'];
    const body = req.body;

    // determine the index based on the event type
    let index;
    if (body.workflow_run) {
      index = 'workflow_run';
    } else if (body.workflow_job) {
      index = 'workflow_job';
    };

    if (index === 'workflow_run') {
      // calculate the duration of the workflow run
      if (body.action === 'completed') {
        const created_at = await new Date(body.workflow_run.created_at);
        const updated_at = await new Date(body.workflow_run.updated_at);
        let duration = await (updated_at - created_at) / 1000;
        // round the duration up to the nearest second, if the duration is less than 1 second, set it to 1 second
        duration = Math.max(1, Math.ceil(duration));
        body.duration = duration;
      } else {
        body.duration;
      }
    }

    // Add a timestamp to the body
    body['@timestamp'] = new Date().toISOString();

    if (index === 'workflow_job') {
      if (body.action == 'in_progress') {
        // If the queueEvent is found, calculate the queue duration
        // Subtract the current time from the time the job was queued

      }
      // calculate the duration of the workflow job
      if (body.action === 'completed') {
        console.log('setting duration');
        const started_at = await new Date(body.workflow_job.started_at);
        const completed_at = await new Date(body.workflow_job.completed_at);
        let duration = await (completed_at - started_at) / 1000;
        duration = Math.max(1, Math.ceil(duration));
        console.log(`duration: ${duration}`);
        body.duration = duration;

        // Find the queue event for the workflow job
        const queueEvent = await client.search({
          index: 'workflow_job',
          body: {
            query: {
              bool: {
                must: [
                  { match: { 'action': 'queued' } },
                  { match: { 'workflow_job.id': body.workflow_job.id } },
                  { match: { 'workflow_job.run_id': body.workflow_job.run_id } }
                ]
              }
            }
          }
        });

        // If the queueEvent is found, calculate the queue duration
        if (queueEvent.body.hits.total.value > 0) {
          const queued_at = await new Date(queueEvent.body.hits.hits[0]._source['@timestamp']);
          let queueDuration = await (started_at - queued_at) / 1000;
          // round the duration up to the nearest second, if the duration is less than 1 second, set it to 1 second
          queueDuration = Math.max(1, Math.ceil(queueDuration));
          console.log(`queueDuration: ${queueDuration}`);
          body.queue_duration = queueDuration;
        }

        // Calucate the duration of each step in steps
        const steps = body.workflow_job.steps;
        for (const step of steps) {
          const step_started_at = await new Date(step.started_at);
          const step_completed_at = await new Date(step.completed_at);
          let stepDuration = await (step_completed_at - step_started_at) / 1000;
          stepDuration = Math.max(1, Math.ceil(stepDuration));
          step.duration = stepDuration;
        }

      } else {
        body.duration;
      }
    }

    const response = await client.index({
      id: id,
      index: index,
      body: body
    });

    res.send(response);
  } catch (error) {
    console.error(error);
    res.status;
  }
});


const app = express();
app.use(express.json());
app.use(router);
app.listen(3000, () => {
  console.log('Forwarding server listening on port 3000');
});
