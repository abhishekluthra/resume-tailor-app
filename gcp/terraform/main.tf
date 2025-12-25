# AlignMyResume GCP Infrastructure
# Terraform configuration for backend migration

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Local variables
locals {
  services = [
    "cloudfunctions.googleapis.com",
    "run.googleapis.com", 
    "apigateway.googleapis.com",
    "secretmanager.googleapis.com",
    "redis.googleapis.com",
    "firestore.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com"
  ]
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset(local.services)
  project  = var.project_id
  service  = each.key

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = false
}

# Secret Manager - OpenAI API Key
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "openai-api-key"
  
  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# Memorystore Redis Instance
resource "google_redis_instance" "cache" {
  name           = "alignmyresume-cache"
  tier           = "BASIC"
  memory_size_gb = 1

  location_id = var.zone

  redis_version     = "REDIS_7_0"
  display_name      = "AlignMyResume Cache"
  reserved_ip_range = "10.0.0.0/29"

  auth_enabled = true

  depends_on = [google_project_service.apis]
}

# Firestore Database
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.apis]
}

# Service Account for Cloud Functions and Cloud Run
resource "google_service_account" "backend_sa" {
  account_id   = "alignmyresume-backend"
  display_name = "AlignMyResume Backend Services"
  description  = "Service account for Cloud Functions and Cloud Run services"
}

# IAM bindings for service account
resource "google_project_iam_member" "backend_sa_secretmanager" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_sa_redis" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_sa_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# VPC Network for internal communication
resource "google_compute_network" "vpc" {
  name                    = "alignmyresume-vpc"
  auto_create_subnetworks = false
}

# Subnet for backend services
resource "google_compute_subnetwork" "backend_subnet" {
  name          = "backend-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

# Firewall rule to allow internal communication
resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}

# Firewall rule for health checks
resource "google_compute_firewall" "allow_health_check" {
  name    = "allow-health-check"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["health-check"]
}