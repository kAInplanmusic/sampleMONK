resource "google_compute_firewall" "lb-health-check" {
  name    = "allow-lb-health-checks"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}
