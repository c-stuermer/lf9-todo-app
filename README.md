# Todo Client & Server (v0.4.0)

A full-stack Todo list application consisting of a Vanilla JavaScript frontend and a Python/Flask REST API backend, deployed as Docker containers on a Linux server.

The project covers the complete stack: REST API design and implementation, a static web frontend, containerized deployment with Docker, a reverse proxy via nginx, and monitoring with Prometheus and Grafana.

## Project Structure

```
/
├── client/                       # Frontend (HTML, CSS, Vanilla JS)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── config.js
│   └── Dockerfile
├── server/                       # REST API (Python, Flask)
│   ├── server.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── openapi.yaml
├── nginx/
│   ├── nginx.conf                # Main server block (loads includes)
│   └── includes/
│       ├── app.conf              # Routes: / and /todo-list
│       └── monitoring.conf      # Optional routes (inactive by default)
├── prometheus/
│   └── prometheus.yml            # Metrics scrape configuration
└── docker-compose.yml            # All services (profiles: nginx, monitoring)
```

---

## Server Setup

> Tested on **Ubuntu 26.04 LTS** (64-bit).

### 1. User Management

```bash
# Unprivileged user
sudo adduser user1

# User for remote administration — add to sudo group
sudo adduser admin1
sudo usermod -aG sudo admin1
```

### 2. SSH Configuration

Restrict SSH access to the `admin1` user only. Add the following line to `/etc/ssh/sshd_config`:

```
AllowUsers admin1
```

```bash
sudo systemctl restart ssh
```

### 3. Firewall (UFW)

Only SSH and HTTP are allowed. All other ports remain closed.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

### 4. Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
```

Add `admin1` to the `docker` group to run Docker without `sudo`:

```bash
sudo usermod -aG docker admin1
# Log out and back in for the group change to take effect
```

---

## Deployment

### Clone the Repository

```bash
sudo apt install -y git
git clone https://github.com/c-stuermer/lf9-todo-app
cd lf9-todo-app
```

### Option A: Quick Start (Full Stack)

Use this option to deploy the complete stack on a fresh server with minimal configuration.

**Optional:** For Grafana to generate correct redirect URLs, set your domain or IP in `docker-compose.yml`:

```bash
nano docker-compose.yml
```

```yaml
- GF_SERVER_DOMAIN=your-domain-or-ip
- GF_SERVER_ROOT_URL=http://your-domain-or-ip/grafana/
```

**Start all services:**

```bash
docker compose up -d
```

All containers are configured with `restart: always` and will start automatically after a reboot.

| Service | URL |
|---------|-----|
| App | `http://<server-ip>` |
| Grafana | `http://<server-ip>/grafana/` |

**Grafana Configuration**

Open Grafana at `http://<server-ip>/grafana/` and log in with the default credentials:

- **Username:** `admin`
- **Password:** `admin`

Add Prometheus as a data source:
1. Go to **Connections → Data Sources → Add new data source**
2. Select **Prometheus**
3. Set the URL to `http://prometheus:9090` — this is the internal Docker address Grafana uses to query Prometheus directly within the container network
4. Click **Save & Test**

---

### Option B: Advanced Deployment (Existing Proxy / Monitoring)

Use this option if you already have a reverse proxy or monitoring stack running on your server.

In `docker-compose.yml`, comment out or remove the `nginx`, `prometheus`, and `grafana` service blocks. Then update the `infra-network` definition to point to your existing Docker network:

```yaml
networks:
  infra-network:
    name: your-existing-network-name
    external: true
```

Then start only the core application containers:

```bash
docker compose up -d
```

`client` will be reachable at `client:80` and `server` at `server:5000` from within your network. The configuration in `nginx/includes/` can be used as a reference for your own proxy setup.

---

To stop all running services:

```bash
docker compose down
```

---

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).
