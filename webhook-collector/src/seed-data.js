// seed opensearch index with data
// Create randomized webhook data for testing based on the schema of the webhook data for workflow_job and workflow_run events

import { Client } from '@opensearch-project/opensearch';

const host = `${process.env.OPENSEARCH_HOST}`;
const protocol = `${process.env.OPENSEARCH_PROTOCOL}`;
const port = `${process.env.OPENSEARCH_PORT}`;
const auth = `${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}`;

const client = new Client({
  nodes: `${protocol}://${auth}@${host}:${port}`.replace(/"/g, ''),
  ssl: {
    rejectUnauthorized: false
  }
});

// Number of workflow runs and jobs to seed
// The number of workflow jobs will be randomized, with workflow_jobs associated with each workflow_run
const numWorkflowRuns = 500;

// Seed the opensearch index with data
async function seed(timestamp) {
  for (let i = 0; i < numWorkflowRuns; i++) {
    // console.log(`Seeding data for iteration ${i}`);
    // Add a random splay to the timestamp +/- 20 minutes
    timestamp = new Date(new Date(timestamp).getTime() + Math.floor(Math.random() * 20 * 60 * 1000)).toISOString();
    // Create a random workflow run
    // These are not all the fields that are available in the webhook data, only a subset for testing purposes
    const workflowRun = {
      '@timestamp': timestamp,
      action: `completed`,
      workflow: {
        id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
        name: `workflow-${Math.floor(Math.random() * 10)}`,
        head_branch: `main`,
        conclusion: `${Math.floor(Math.random() * 10) % 2 === 0 ? `success` : `failure`}`,
      },
      workflow_run: {
        id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
        name: `workflow-${Math.floor(Math.random() * 10)}`,
        path: `.github/workflows/workflow-${Math.floor(Math.random() * 10)}.yml`,
      },
      repository: {
        id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
        node_id: `R_zzzzzzzzzzzz`,
        name: `Repo-${Math.floor(Math.random() * 10)}`,
        full_name: `org-${Math.floor(Math.random() * 10)}/Repo-${Math.floor(Math.random() * 10)}`,
      },
      organization: {
        login: `org-${Math.floor(Math.random() * 10)}`,
        id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
      },
      duration: Math.floor(Math.random() * 1000),
      queue_duration: Math.floor(Math.random() * 1000),
    };

    // Index the workflow run
    await client.index({
      index: "workflow_run",
      body: workflowRun,
    });

    // Create a random number of workflow jobs associated with the workflow run between 1-10
    const numWorkflowJobs = Math.floor(Math.random() * 10) + 1;

    for (let j = 0; j < numWorkflowJobs; j++) {
      // Create a random workflow job
      // These are not all the fields that are available in the webhook data, only a subset for testing purposes
      const workflowJob = {
        '@timestamp': timestamp,
        action: `completed`,
        duration: Math.floor(Math.random() * 1000),
        queue_duration: Math.floor(Math.random() * 500),
        workflow_job: {
          id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
          name: `job-${Math.floor(Math.random() * 10)}`,
          run_id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
          workflow_name: `workflow-${Math.floor(Math.random() * 10)}`,
          labels: [`${Math.floor(Math.random() * 10) % 2 === 0 ? `ubuntu-latest` : `windows-latest`}`],
          head_branch: `main`,
          conclusion: `${Math.floor(Math.random() * 10) % 2 === 0 ? `success` : `failure`}`,
          run_attempt: 1,
          steps: [
            {
              name: `step-${Math.floor(Math.random() * 10)}`,
              status: `completed`,
              conclusion: `${Math.floor(Math.random() * 10) % 2 === 0 ? `success` : `failure`}`,
              number: 1,
              duration: Math.floor(Math.random() * 1000),
            },
          ],
        },
        repository: {
          id: 987654321,
          node_id: `R_zzzzzzzzzzzz`,
          name: `Repo-${Math.floor(Math.random() * 10)}`,
          full_name: `org-${Math.floor(Math.random() * 10)}/Repo-${Math.floor(Math.random() * 10)}`,
          private: true,
          owner: {
            login: `org-${Math.floor(Math.random() * 10)}`,
            id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
          },
        },
        organization: {
          login: `org-${Math.floor(Math.random() * 10)}`,
          id: Math.floor(new Date(timestamp).getTime() / 1000) + i,
        },
      };

      // Index the workflow job data
      await client.index({
        index: "workflow_job",
        body: workflowJob,
      });
    }
  }
};

if (process.env.SEED_DATA == 'true') {
  seed(new Date().toISOString());
  // seed from 1 hour ago
  seed(new Date(Date.now() - 60 * 60 * 1000).toISOString());
  // seed from 2 hours ago
  seed(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
  // seed from 3 hours ago
  seed(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString());
  // seed from 4 hours ago
  seed(new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
} else {
  console.log('Skipping data seeding');
}
export default { seed };
