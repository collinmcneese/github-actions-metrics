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

/**
  * Calculate the duration of two dates in seconds
  * @param {Object} start - The start date
  * @param {Object} end - The end date
  * @returns {Number} - The duration in seconds
  * */
async function durationCalculate({ start, end }) {
  let duration = await (end - start) / 1000;
  duration = Math.max(1, Math.ceil(duration));
  return duration;
}


/**
 * Lookup the queue event for a workflow job
 * @param {Object} body - The body of the webhook event
 * @returns {Object} - The queue event for the workflow job
 * */
async function lookupQueueEvent(body) {
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
  return queueEvent;
}

/**
 * Forward the GitHub webhook to OpenSearch
 * */
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
      const created_at = await new Date(body.workflow_run.created_at);
      const updated_at = await new Date(body.workflow_run.updated_at);
      // calculate the duration of the workflow run
      if (body.action === 'completed') {
        body.duration = await durationCalculate({ start: created_at, end: updated_at });
      } else {
        body.duration;
      }
    }

    // Add a timestamp to the body
    body['@timestamp'] = new Date().toISOString();

    if (index === 'workflow_job') {
      const started_at = await new Date(body.workflow_job.started_at);
      const completed_at = await new Date(body.workflow_job.completed_at);

      if (body.action == 'in_progress') {
        // If the queueEvent is found, calculate the queue duration
        // Subtract the current time from the time the job was queued

      }
      // calculate the duration of the workflow job
      if (body.action === 'completed') {
        console.log('setting duration');
        body.duration = await durationCalculate({ start: started_at, end: completed_at });

        // Find the queue event for the workflow job
        const queueEvent = await lookupQueueEvent(body);

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
          step.duration = await durationCalculate({ start: step_started_at, end: step_completed_at });
        }

      } else {
        body.duration;
      }
    }

    // Index the body in OpenSearch
    const response = await client.index({
      id: id,
      index: index,
      body: body
    });

    // Send the response from OpenSearch to the client
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status;
  }
});

// Export the router and testing functions
export default { router };
export const testing = {
  durationCalculate,
  lookupQueueEvent
};
