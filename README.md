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
│       └── monitoring.conf      # Routes: /grafana
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

Only SSH, HTTP and Grafana are allowed. All other ports remain closed.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
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

| File               | Routes                |
|--------------------|-----------------------|
| `app.conf`         | `/` and `/todo-list`  |
| `monitoring.conf`  | `/grafana`            |

The repository includes a ready-to-use nginx container (`nginx` profile) with the configuration split into include files under `nginx/includes/`. **If you already have a proxy running**, use these files as a reference and configure your proxy with the routes above.

### 7. Monitoring (optional)

Prometheus and Grafana are available via the `monitoring` profile. Grafana is accessible directly at `http://<server-ip>:3000`.

Grafana default login: `admin` / `admin`. Add Prometheus as a data source with URL `http://prometheus:9090`.

### 8. Deploy

All services are defined in a single `docker-compose.yml` using profiles. Services without a profile always start; `nginx` and `monitoring` are optional.

```bash
# App only
docker compose up -d

# App + reverse proxy
docker compose --profile nginx up -d

# App + reverse proxy + monitoring
docker compose --profile nginx --profile monitoring up -d
```

| Service      | Profile      | Description          | Accessible at                   |
|--------------|--------------|----------------------|---------------------------------|
| `client`     | —            | Static frontend      | internal only                   |
| `server`     | —            | Flask REST API       | internal only                   |
| `nginx`      | `nginx`      | Reverse proxy        | `http://<server-ip>`            |
| `prometheus` | `monitoring` | Metrics collection   | internal only                   |
| `grafana`    | `monitoring` | Monitoring dashboard | `http://<server-ip>:3000`       |

To stop all running services:

```bash
docker compose --profile nginx --profile monitoring down
```

---

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).
