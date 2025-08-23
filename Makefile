.PHONY: help build build-dev up down logs ps shell-db shell-app clean

# Default target
help:
	@echo "Available targets:"
	@echo "  build       - Build the production Docker image"
	@echo "  build-dev   - Build the development Docker image"
	@echo "  up          - Start all services in detached mode"
	@echo "  up-dev      - Start development environment"
	@echo "  down        - Stop all services"
	@echo "  logs        - View logs of all services"
	@echo "  logs-app    - View logs of app service only"
	@echo "  logs-db     - View logs of database service only"
	@echo "  ps          - List running containers"
	@echo "  shell-app   - Access shell in app container"
	@echo "  shell-db    - Access database shell"
	@echo "  clean       - Remove all containers and volumes"

# Build targets
build:
	docker-compose build --no-cache

build-dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml build --no-cache

# Up/Down targets
up:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.docker .env; \
		echo "Please edit .env file and update APP_SECRET before running 'make up' again"; \
		exit 1; \
	fi
	docker-compose up -d

up-dev:
	@if [ ! -f .env ]; then \
		echo "Creating .env file for development..."; \
		cp .env.docker .env; \
		sed -i 's/replace-me-with-a-random-string/dev-secret-key/g' .env; \
	fi
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

down:
	docker-compose down

# Log targets
logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f umami

logs-db:
	docker-compose logs -f db

# Management targets
ps:
	docker-compose ps

shell-app:
	docker exec -it umami-app sh

shell-db:
	docker exec -it umami-db psql -U umami

# MySQL targets
up-mysql:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.docker .env; \
		echo "Please edit .env file and update APP_SECRET before running 'make up-mysql' again"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.mysql.yml up -d

shell-db-mysql:
	docker exec -it umami-db-mysql mysql -u umami -p

# Clean targets
clean:
	docker-compose down -v
	docker system prune -f

clean-images:
	docker images | grep umami | awk '{print $3}' | xargs docker rmi -f

# Development helper
dev-setup:
	@echo "Setting up development environment..."
	npm install -g pnpm@9
	pnpm install
	cp .env.docker .env
	@echo "Development environment setup complete!"
	@echo "Run 'make up-dev' to start the development environment"