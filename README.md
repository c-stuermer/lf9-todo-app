# Todo Client & Server (v0.3.0)

A full-stack Todo list application consisting of a Vanilla JavaScript frontend and a Python/Flask REST API backend, deployed as Docker containers on a Linux server.

The project covers the complete stack: REST API design and implementation, a static web frontend, containerized deployment with Docker, a reverse proxy via nginx, and monitoring with Prometheus and Grafana.

## Project Structure

```
/
├── client/                  # Frontend (HTML, CSS, Vanilla JS)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── config.js
│   └── Dockerfile
├── server/                  # REST API (Python, Flask)
│   ├── server.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── openapi.yaml
├── nginx/
│   └── nginx.conf           # Reverse proxy configuration
├── prometheus/
│   └── prometheus.yml       # Metrics scrape configuration
└── docker-compose.yml
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

### 6. nginx

nginx runs on the host and acts as reverse proxy — routing incoming HTTP requests to the respective containers.

```bash
sudo apt install -y nginx
```

Copy the nginx configuration from the repository and enable it:

```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/todo
sudo ln -s /etc/nginx/sites-available/todo /etc/nginx/sites-enabled/todo
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Deploy the Application

```bash
docker compose up -d
```

This starts four containers:

| Container    | Description                   | Accessible at              |
|--------------|-------------------------------|----------------------------|
| `client`     | Static frontend (nginx)       | via nginx (port 80)        |
| `server`     | Flask REST API                | via nginx (port 80)        |
| `prometheus` | Metrics collection            | internal only              |
| `grafana`    | Monitoring dashboard          | `http://<server-ip>:3000`  |

The application is available at `http://<server-ip>`.

> `client` and `server` only bind to `127.0.0.1` — they are not directly reachable from outside. All traffic goes through nginx.

To stop all containers:

```bash
docker compose down
```

### 8. Grafana

Open Grafana at `http://<server-ip>:3000`. Default login: `admin` / `admin`.

Add Prometheus as a data source:
- **URL:** `http://prometheus:9090`

---

## API

The full REST API specification is documented in [`server/openapi.yaml`](server/openapi.yaml).
