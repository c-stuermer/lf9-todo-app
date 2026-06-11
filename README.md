# Todo Client & Server (v0.4.0)

A full-stack Todo list application consisting of a Vanilla JavaScript frontend and a Python/Flask REST API backend, deployed as Docker containers on a Linux server.

The project covers the complete stack: REST API design and implementation, a static web frontend, containerized deployment with Docker, a reverse proxy via nginx, and monitoring with Prometheus and Grafana.

## Architecture

![Server Architecture](docs/server_architecture.drawio.png)

| Service | Image | Description |
|---------|-------|-------------|
| nginx | nginx:alpine | Reverse proxy, routes traffic to client and server |
| client | nginx:alpine | Serves the static frontend |
| server | custom | Flask REST API |
| grafana | grafana/grafana | Metrics visualization dashboard |
| prometheus | prom/prometheus | Scrapes metrics from Flask and node-exporter |
| node-exporter | prom/node-exporter | Exposes host system metrics |

---

## Server Setup

> Tested on **Ubuntu 26.04 LTS** (64-bit).

### 1. User Management

Create an unprivileged user (optional) and a separate admin user for remote access via SSH:

```bash
# Unprivileged user (optional)
sudo adduser user1

# User for remote administration — add to sudo group
sudo adduser admin1
sudo usermod -aG sudo admin1
```

### 2. Text Editor

Install a terminal text editor for editing config files:

```bash
sudo apt install -y nano
```

### 3. SSH Configuration

Restrict SSH access to `admin1` by editing the SSH config file and restarting the service:

```bash
sudo nano /etc/ssh/sshd_config
```

Add the following line:

```
AllowUsers admin1
```

Restart ssh service to make the change take effect:

```bash
sudo systemctl restart ssh
```

### 4. Firewall (UFW)

Allow only SSH and HTTP traffic — all other ports remain closed.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

### 5. Docker

Install Docker and Docker Compose, then enable and start the Docker service so it runs automatically on boot:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
```

Add `admin1` to the `docker` group to run Docker without `sudo`:

```bash
sudo usermod -aG docker admin1
```

Log out and back in for the group change to take effect

---

## Deployment

### 1. Clone the Repository

Install git and clone the repository to the server:

```bash
sudo apt install -y git
git clone https://github.com/c-stuermer/lf9-todo-app
cd lf9-todo-app
```

### 2. Configuration

Replace the placeholders with your server's domain or IP so Grafana generates correct redirect URLs:

```bash
nano docker-compose.yml
```
Change the following lines according to your server address or domain:

```yaml
- GF_SERVER_DOMAIN=your-domain-or-ip                    # ← replace this
- GF_SERVER_ROOT_URL=http://your-domain-or-ip/grafana/  # ← replace this
```

### 3. Start all services:

```bash
docker compose up -d
```

All containers are configured with `restart: always` and will start automatically after a reboot.

| Service | URL |
|---------|-----|
| App | `http://<server-ip>` |
| Grafana | `http://<server-ip>/grafana/` |

### 4. Grafana Configuration

Open Grafana at `http://<server-ip>/grafana/` and log in with the default credentials:

- **Username:** `admin`
- **Password:** `admin`

Add Prometheus as a data source:
1. Go to **Connections → Data Sources → Add new data source**
2. Select **Prometheus**
3. Set the URL to `http://prometheus:9090` — this is the internal Docker address Grafana uses to query Prometheus directly within the container network
4. Click **Save & Test**

Import dashboards for both metric sources:
1. Go to **Dashboards → New → Import**
2. Enter dashboard ID `11074` → **Load** — Flask application metrics
3. Repeat and enter dashboard ID `1860` → **Load** — Host system metrics (CPU, RAM, Disk)

---

## To stop all running services:

```bash
docker compose down
```

---

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).

---

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
│       └── monitoring.conf       # Routes: monitoring
├── prometheus/
│   └── prometheus.yml            # Metrics scrape configuration
├── docs/
│   └── server_architecture.drawio.png
└── docker-compose.yml
```
