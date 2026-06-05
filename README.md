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

## Server Setup & Deployment

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

### 5. Clone the Repository

```bash
git clone https://github.com/c-stuermer/lf9-todo-app
cd lf9-todo-app
```

### 6. Reverse Proxy

A reverse proxy is required to route incoming HTTP requests to the containers. The following routes must be configured:

The repository includes a ready-to-use nginx container (`nginx` profile), configured in `nginx/includes/app.conf`. **If you already have a proxy running**, use this file as a reference — it routes `/` to the client container and `/todo-list` to the server container.

### 7. Monitoring (optional)

Prometheus and Grafana are available via the `monitoring` profile. Grafana is accessible through the reverse proxy at `http://<server-ip>/grafana/`.

Before starting, set your domain or IP in `docker-compose.yml`:

```yaml
- GF_SERVER_DOMAIN=your-domain-or-ip
- GF_SERVER_ROOT_URL=http://your-domain-or-ip/grafana/
```

Grafana default login: `admin` / `admin`. Add Prometheus as a data source with URL `http://prometheus:9090`.

### 8. Deploy

The app uses two Docker networks:

- `todo-internal` — internal communication between `client` and `server`
- `infra-network` — shared with the reverse proxy and monitoring stack, so they can reach `client:80` and `server:5000` by service name

**If you are using the included nginx and monitoring containers**, create the shared network first:

```bash
docker network create infra-network
docker compose --profile nginx --profile monitoring up -d
```

**If you already have a proxy or monitoring stack running**, change the network name in `docker-compose.yml` to your existing network:

```yaml
infra-network:
  name: your-existing-network-name  # <- change this
  external: true
```

Then start only the app:

```bash
docker compose up -d
```

| Service      | Profile      | Description          | Accessible at                            |
|--------------|--------------|----------------------|------------------------------------------|
| `client`     | —            | Static frontend      | internal only (`client:80`)              |
| `server`     | —            | Flask REST API       | internal only (`server:5000`)            |
| `nginx`      | `nginx`      | Reverse proxy        | `http://<server-ip>`                     |
| `prometheus` | `monitoring` | Metrics collection   | internal only                            |
| `grafana`    | `monitoring` | Monitoring dashboard | `http://<server-ip>/grafana/`            |

To stop all running services:

```bash
docker compose --profile nginx --profile monitoring down
```

---

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).
