[![CodeQL](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/github-code-scanning/codeql)
[![CI Webhook Collector](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/ci-webhook-collector.yml/badge.svg)](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/ci-webhook-collector.yml)
[![CI Grafana / OpenSearch](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/ci-grafana-opensearch.yml/badge.svg)](https://github.com/collinmcneese/github-actions-metrics/actions/workflows/ci-grafana-opensearch.yml)

# GitHub Actions Metrics

Repository with Example references for GitHub Actions Metrics visualizations.

> [!NOTE]
> The content in this repository is for demonstration purposes only and should not be used in a production environment directly.

- [Grafana \& OpenSearch](#grafana--opensearch)
  - [Contents](#contents)
  - [Quick Start](#quick-start)
- [Webhook Collector](#webhook-collector)
  - [Webhook Collector Contents](#webhook-collector-contents)
  - [Webhook Collector Functionality](#webhook-collector-functionality)
  - [Webhook Collector Setup and Configuration](#webhook-collector-setup-and-configuration)
- [Security Considerations](#security-considerations)

## Grafana & OpenSearch

[./grafana-opensearch](./grafana-opensearch)

This directory contains the necessary configuration and code to set up a Grafana dashboard with OpenSearch as the datasource. It's designed to collect and visualize data from webhooks using OpenSearch and Grafana.

![Grafana Dashboard Part 1](./grafana-opensearch/images/workflows-overview-1.png)
![Grafana Dashboard Part 2](./grafana-opensearch/images/workflows-overview-2.png)

### Contents

- **`.env` and `.env.example`**: Environment variable files. Copy `.env.example` to `.env` and update the values according to your OpenSearch setup.
- **`docker-compose.yml`**: Docker Compose file to spin up the OpenSearch cluster, Grafana, and the webhook collector service.
- **`data/grafana/provisioning`**: Contains Grafana provisioning files for datasources and dashboards, allowing Grafana to automatically load the OpenSearch datasource and predefined dashboards on startup.
  - **`dashboards/default.yaml`**: Configuration for dashboard provisioning.
  - **`datasources/default.yaml`**: Configuration for datasource provisioning, including the OpenSearch datasource.
- Uses the [./webhook-collector](./webhook-collector) service to collect GitHub webhooks and store them in OpenSearch, configured with environment variables in the [./grafa-opensearch/.env](./grafana-opensearch/.env) file.

### Quick Start

1. Ensure Docker, Docker Compose, Node.js, and npm are installed on your system.
   1. Node.js and npm are only rerquired if you plan to run the webhook collector service outside of Docker or make development changes.
2. Copy `grafana-opensearch/.env.example` to `grafana-opensearch/.env` and update the environment variables to match your OpenSearch setup.
   1. Environment variables:
   2. `OPENSEARCH_HOST`: The hostname of the OpenSearch cluster.
   3. `OPENSEARCH_PROTOCOL`: The protocol (`http` or `https`) to use.
   4. `OPENSEARCH_PORT`: The port on which the OpenSearch cluster is accessible.
   5. `OPENSEARCH_USERNAME`: The username for OpenSearch authentication.
   6. `OPENSEARCH_PASSWORD`: The password for OpenSearch authentication.
   7. `TARGET_TYPE`: The backend type to use for storing the data. Currently, only `opensearch` is supported.
   8. `SEED_DATA`: `true` or `false` to seed the OpenSearch database with initial sample data.
3. From the `grafana-opensearch` directory, run `docker-compose up` to start the OpenSearch cluster, Grafana, and the webhook collector service.
   1. This will automatically run the `seed` container once to seed the OpenSearch database with initial data.
4. Access Grafana at `http://localhost:13000` (default credentials are admin/admin, but it's recommended to change these).
5. To seed the OpenSearch database with more data, the `seed` container can be run manually using `docker-compose run seed` more times.
6. To collect real data, setup webhooks from GitHub for `workflow_run` and `workflow_job` events to point to the webhook collector service.
   1. The webhook collector service listens on port 3000 by default.  Tools such as [smee.io](https://smee.io/) can be used to forward GitHub webhooks to the service.
   2. The webhook collector service will automatically index these events into OpenSearch for visualization in Grafana.

For more detailed instructions and configuration options, refer to the individual README files within each subdirectory.

## Webhook Collector

This Node.js application serves as a bridge between GitHub webhooks and backend data stores.  Different data store backends are configured as part of the application and specified with the `TARGET_TYPE` environment variable.

Supported backends include:

- `opensearch`: Indexes incoming webhook data into an OpenSearch cluster.

### Webhook Collector Contents

- **`webhook-collector`**: A simple Node.js application that collects GitHub webhooks and stores them in OpenSearch.
  - **`src/index.js`**: The main application file.
  - **`src/opensearch.js`**: The OpenSearch backend module.
  - **`package.json`**: Defines the project dependencies and scripts.
  - **`src/seed-data.js`**: A script to seed the OpenSearch database with initial data.
  - **`.gitignore`**: Git ignore file for Node.js projects.
  - **`dist/`**: Contains the compiled JavaScript files, used by containerized deployments from docker-compose.

### Webhook Collector Functionality

1. **Server Initialization**: An Express server is initialized and configured to listen for incoming HTTP requests on port 3000.
2. **Route Handling**:
   - Route data is configured in the target module, which is selected based on the `TARGET_TYPE` environment variable.
   - A GET route at the root (`/`) that simply returns a server status message.
   - A POST route at the root (`/`) designed to receive GitHub webhook payloads.
3. **Webhook Processing**:
   - For `workflow_run` and `workflow_job` events, it calculates the duration of the event. For `workflow_job` events, it also calculates the queue duration and the duration of each step within the job.
   - Adds a timestamp to the event data.
   - Stores the event data in the configured backend.

### Webhook Collector Setup and Configuration

- **Dependencies**: Requires Node.js, npm, and access to a backend data store.
- **Environment Variables**: Set the following environment variables to configure application:
  - `TARGET_TYPE`: The backend type to use for storing the data. Currently, only `opensearch` is supported.
  - OpenSearch Options:
    - `OPENSEARCH_HOST`: The hostname of the OpenSearch cluster.
    - `OPENSEARCH_PROTOCOL`: The protocol (`http` or `https`) to use.
    - `OPENSEARCH_PORT`: The port on which the OpenSearch cluster is accessible.
    - `OPENSEARCH_USERNAME`: The username for OpenSearch authentication.
    - `OPENSEARCH_PASSWORD`: The password for OpenSearch authentication.
- **Running the Server**: Execute `npm run dev` to start the server locally for development. Ensure that the environment variables are set before starting the server.

## Security Considerations

- The webhook-collector server does not implement authentication for incoming webhook requests.
- The OpenSearch client is configured with `rejectUnauthorized: false` for SSL, which is only for development purposes.
