resource "google_compute_network" "vpc_network" {
  name                    = "sample-monk-vpc"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "allow-webrtc" {
  name    = "allow-webrtc"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "udp"
    ports    = ["49152-65535"]
  }

  allow {
    protocol = "tcp"
    ports    = ["3478"]
  }

  source_ranges = ["0.0.0.0/0"]
}
