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
│       └── monitoring.conf       # Routes: monitoring
├── prometheus/
│   └── prometheus.yml            # Metrics scrape configuration
└── docker-compose.yml
```

---

## Server Setup

> Tested on **Ubuntu 26.04 LTS** (64-bit).

### 1. User Management

Create an unprivileged user and a separate admin user for remote access via SSH:

```bash
# Unprivileged user
sudo adduser user1

# User for remote administration — add to sudo group
sudo adduser admin1
sudo usermod -aG sudo admin1
```

### 2. SSH Configuration

Restrict SSH access to `admin1` only by editing the SSH config file and restarting the service:

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

### 3. Firewall (UFW)

Allow only SSH and HTTP traffic — all other ports remain closed.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

### 4. Docker

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
# Log out and back in for the group change to take effect
```

---

## Deployment

### Clone the Repository

Install git and clone the repository to the server:

```bash
sudo apt install -y git
git clone https://github.com/c-stuermer/lf9-todo-app
cd lf9-todo-app
```

### Option A: Full Stack with Proxy / Monitoring

Use this option to deploy the complete stack on a fresh server with minimal configuration.

**Configure Grafana:** 

Replace the placeholders with your server's domain or IP so Grafana generates correct redirect URLs:

```bash
nano docker-compose.yml
```
Change the following lines according to your server address or domain:

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

### Option B: Advanced Deployment with Existing Proxy / Monitoring

Use this option if you already have a reverse proxy or monitoring stack running on your server.

In `docker-compose.yml`, comment out or remove the `nginx`, `prometheus`, and `grafana` service blocks. Then update the `infra-network` definition to point to your existing Docker network:

```yaml
networks:
  infra-network:
    name: your-existing-network-name    # ← replace this
    external: true                      # ← add this
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
