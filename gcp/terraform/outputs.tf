# Terraform outputs for GCP infrastructure

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.cache.port
}

output "redis_auth_string" {
  description = "Redis auth string"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}

output "service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.backend_sa.email
}

output "vpc_network" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "backend_subnet" {
  description = "Backend subnet name"
  value       = google_compute_subnetwork.backend_subnet.name
}

output "secret_manager_secret_id" {
  description = "Secret Manager secret ID for OpenAI API key"
  value       = google_secret_manager_secret.openai_api_key.secret_id
}