# Terraform variables for GCP infrastructure

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "nurel-app-dev"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-east1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-east1-b"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "cloud_function_memory" {
  description = "Memory allocation for Cloud Functions"
  type        = string
  default     = "512Mi"
}

variable "cloud_function_timeout" {
  description = "Timeout for Cloud Functions"
  type        = string
  default     = "15s"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run"
  type        = string
  default     = "2Gi"
}

variable "cloud_run_timeout" {
  description = "Timeout for Cloud Run"
  type        = string
  default     = "30s"
}

variable "cloud_run_max_instances" {
  description = "Maximum instances for Cloud Run"
  type        = number
  default     = 10
}

variable "billing_budget_amount" {
  description = "Monthly billing budget in USD"
  type        = number
  default     = 100
}