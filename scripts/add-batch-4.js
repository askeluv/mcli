#!/usr/bin/env node
// Batch 4: Add 50 more CLI tools

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.join(__dirname, '../registry/tools.json');
const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

const existingSlugs = new Set(data.tools.map(t => t.slug));

const newTools = [
  // More Kubernetes tools
  {
    slug: "velero",
    name: "Velero",
    vendor: { name: "VMware", domain: "velero.io", verified: true },
    repo: "https://github.com/vmware-tanzu/velero",
    docs: "https://velero.io/docs/",
    install: { brew: "velero" },
    capabilities: { jsonOutput: true, auth: ["kubeconfig"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["kubernetes", "backup", "disaster-recovery"],
    tier: "verified",
    description: "Backup and migrate Kubernetes resources and persistent volumes."
  },
  {
    slug: "kubeseal",
    name: "kubeseal",
    vendor: { name: "Bitnami", domain: "github.com/bitnami-labs", verified: true },
    repo: "https://github.com/bitnami-labs/sealed-secrets",
    docs: "https://sealed-secrets.netlify.app/",
    install: { brew: "kubeseal" },
    capabilities: { jsonOutput: true, auth: ["kubeconfig"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["kubernetes", "secrets", "security"],
    tier: "verified",
    description: "Encrypt secrets for safe GitOps workflows with Sealed Secrets."
  },
  {
    slug: "kops",
    name: "kops",
    vendor: { name: "Kubernetes", domain: "kops.sigs.k8s.io", verified: true },
    repo: "https://github.com/kubernetes/kops",
    docs: "https://kops.sigs.k8s.io/",
    install: { brew: "kops" },
    capabilities: { jsonOutput: true, auth: ["cloud credentials"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["kubernetes", "infrastructure"],
    tier: "verified",
    description: "Production Grade K8s Installation, Upgrades, and Management."
  },
  {
    slug: "kubescape",
    name: "Kubescape",
    vendor: { name: "ARMO", domain: "kubescape.io", verified: false },
    repo: "https://github.com/kubescape/kubescape",
    docs: "https://kubescape.io/docs/",
    install: { brew: "kubescape" },
    capabilities: { jsonOutput: true, auth: ["kubeconfig"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["kubernetes", "security", "compliance"],
    tier: "community",
    description: "Kubernetes security platform for risk analysis and compliance."
  },
  {
    slug: "popeye",
    name: "Popeye",
    vendor: { name: "derailed", domain: "github.com/derailed", verified: false },
    repo: "https://github.com/derailed/popeye",
    docs: "https://github.com/derailed/popeye#readme",
    install: { brew: "popeye" },
    capabilities: { jsonOutput: true, auth: ["kubeconfig"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["kubernetes", "linting", "health"],
    tier: "community",
    description: "Kubernetes cluster resource sanitizer - find misconfigurations."
  },
  {
    slug: "kubeshark",
    name: "Kubeshark",
    vendor: { name: "Kubeshark", domain: "kubeshark.co", verified: false },
    repo: "https://github.com/kubeshark/kubeshark",
    docs: "https://docs.kubeshark.co/",
    install: { brew: "kubeshark" },
    capabilities: { jsonOutput: true, auth: ["kubeconfig"], idempotent: false, interactive: true, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 3, tokenEfficiency: 3, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["kubernetes", "networking", "debugging"],
    tier: "community",
    description: "API traffic analyzer for Kubernetes - Wireshark for K8s."
  },
  // Docker/Container tools
  {
    slug: "crane",
    name: "crane",
    vendor: { name: "Google", domain: "github.com/google", verified: true },
    repo: "https://github.com/google/go-containerregistry",
    docs: "https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane.md",
    install: { brew: "crane", go: "github.com/google/go-containerregistry/cmd/crane" },
    capabilities: { jsonOutput: true, auth: ["registry credentials"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["containers", "registry", "images"],
    tier: "verified",
    description: "Tool for interacting with container registries."
  },
  {
    slug: "regctl",
    name: "regctl",
    vendor: { name: "regclient", domain: "github.com/regclient", verified: false },
    repo: "https://github.com/regclient/regclient",
    docs: "https://github.com/regclient/regclient#readme",
    install: { brew: "regclient" },
    capabilities: { jsonOutput: true, auth: ["registry credentials"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["containers", "registry"],
    tier: "community",
    description: "Docker and OCI Registry Client."
  },
  {
    slug: "cosign",
    name: "Cosign",
    vendor: { name: "Sigstore", domain: "sigstore.dev", verified: true },
    repo: "https://github.com/sigstore/cosign",
    docs: "https://docs.sigstore.dev/cosign/overview/",
    install: { brew: "cosign", go: "github.com/sigstore/cosign/cmd/cosign" },
    capabilities: { jsonOutput: true, auth: ["various"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["containers", "security", "signing"],
    tier: "verified",
    description: "Container signing, verification, and storage in OCI registries."
  },
  // Testing tools
  {
    slug: "k6",
    name: "k6",
    vendor: { name: "Grafana Labs", domain: "k6.io", verified: true },
    repo: "https://github.com/grafana/k6",
    docs: "https://k6.io/docs/",
    install: { brew: "k6", apt: "k6" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["testing", "load-testing", "performance"],
    tier: "verified",
    description: "Modern load testing tool using JavaScript."
  },
  {
    slug: "locust",
    name: "Locust",
    vendor: { name: "Locust", domain: "locust.io", verified: false },
    repo: "https://github.com/locustio/locust",
    docs: "https://docs.locust.io/",
    install: { pip: "locust" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 9,
    categories: ["testing", "load-testing", "performance"],
    tier: "community",
    description: "Scalable user load testing tool written in Python."
  },
  {
    slug: "playwright",
    name: "Playwright",
    vendor: { name: "Microsoft", domain: "playwright.dev", verified: true },
    repo: "https://github.com/microsoft/playwright",
    docs: "https://playwright.dev/docs/intro",
    install: { npm: "playwright" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: true, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["testing", "browser", "e2e"],
    tier: "verified",
    description: "Framework for Web Testing and Automation across browsers."
  },
  {
    slug: "cypress",
    name: "Cypress",
    vendor: { name: "Cypress.io", domain: "cypress.io", verified: true },
    repo: "https://github.com/cypress-io/cypress",
    docs: "https://docs.cypress.io/",
    install: { npm: "cypress" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: true, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["testing", "browser", "e2e"],
    tier: "verified",
    description: "Fast, easy and reliable testing for anything that runs in a browser."
  },
  // Documentation tools
  {
    slug: "mkdocs",
    name: "MkDocs",
    vendor: { name: "MkDocs", domain: "mkdocs.org", verified: false },
    repo: "https://github.com/mkdocs/mkdocs",
    docs: "https://www.mkdocs.org/",
    install: { brew: "mkdocs", pip: "mkdocs" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["documentation", "markdown"],
    tier: "community",
    description: "Project documentation with Markdown."
  },
  {
    slug: "docusaurus",
    name: "Docusaurus",
    vendor: { name: "Meta", domain: "docusaurus.io", verified: true },
    repo: "https://github.com/facebook/docusaurus",
    docs: "https://docusaurus.io/docs",
    install: { npm: "@docusaurus/core" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["documentation", "static-site"],
    tier: "verified",
    description: "Build optimized websites quickly with React."
  },
  {
    slug: "hugo",
    name: "Hugo",
    vendor: { name: "Hugo", domain: "gohugo.io", verified: false },
    repo: "https://github.com/gohugoio/hugo",
    docs: "https://gohugo.io/documentation/",
    install: { brew: "hugo", apt: "hugo" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["documentation", "static-site"],
    tier: "community",
    description: "Fast and flexible static site generator built in Go."
  },
  {
    slug: "jekyll",
    name: "Jekyll",
    vendor: { name: "Jekyll", domain: "jekyllrb.com", verified: false },
    repo: "https://github.com/jekyll/jekyll",
    docs: "https://jekyllrb.com/docs/",
    install: { brew: "jekyll", gem: "jekyll" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["documentation", "static-site", "ruby"],
    tier: "community",
    description: "Transform your plain text into static websites and blogs."
  },
  // Cloud-native tools
  {
    slug: "pulumi",
    name: "Pulumi",
    vendor: { name: "Pulumi", domain: "pulumi.com", verified: true },
    repo: "https://github.com/pulumi/pulumi",
    docs: "https://www.pulumi.com/docs/",
    install: { brew: "pulumi" },
    capabilities: { jsonOutput: true, auth: ["various cloud"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["infrastructure", "cloud", "devops"],
    tier: "verified",
    description: "Infrastructure as Code in any programming language."
  },
  {
    slug: "cdktf",
    name: "CDKTF",
    vendor: { name: "HashiCorp", domain: "developer.hashicorp.com", verified: true },
    repo: "https://github.com/hashicorp/terraform-cdk",
    docs: "https://developer.hashicorp.com/terraform/cdktf",
    install: { npm: "cdktf-cli" },
    capabilities: { jsonOutput: true, auth: ["provider-specific"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["infrastructure", "cloud", "terraform"],
    tier: "verified",
    description: "Cloud Development Kit for Terraform."
  },
  {
    slug: "cdk",
    name: "AWS CDK",
    vendor: { name: "Amazon Web Services", domain: "aws.amazon.com", verified: true },
    repo: "https://github.com/aws/aws-cdk",
    docs: "https://docs.aws.amazon.com/cdk/",
    install: { npm: "aws-cdk" },
    capabilities: { jsonOutput: true, auth: ["AWS credentials"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["aws", "infrastructure", "cloud"],
    tier: "verified",
    description: "AWS Cloud Development Kit - define cloud infrastructure using code."
  },
  // CLI frameworks/generators
  {
    slug: "cobra-cli",
    name: "Cobra CLI",
    vendor: { name: "spf13", domain: "cobra.dev", verified: false },
    repo: "https://github.com/spf13/cobra-cli",
    docs: "https://cobra.dev/",
    install: { go: "github.com/spf13/cobra-cli" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["go", "cli-framework"],
    tier: "community",
    description: "Generator for Cobra CLI applications."
  },
  // Proxy/Network tools
  {
    slug: "mitmproxy",
    name: "mitmproxy",
    vendor: { name: "mitmproxy", domain: "mitmproxy.org", verified: false },
    repo: "https://github.com/mitmproxy/mitmproxy",
    docs: "https://docs.mitmproxy.org/stable/",
    install: { brew: "mitmproxy", pip: "mitmproxy" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 3, tokenEfficiency: 3, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["proxy", "debugging", "security"],
    tier: "community",
    description: "Interactive TLS-capable intercepting proxy for HTTP/1, HTTP/2."
  },
  {
    slug: "ngrok",
    name: "ngrok",
    vendor: { name: "ngrok", domain: "ngrok.com", verified: true },
    repo: "https://github.com/ngrok/ngrok",
    docs: "https://ngrok.com/docs",
    install: { brew: "ngrok" },
    capabilities: { jsonOutput: true, auth: ["env:NGROK_AUTHTOKEN"], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 9,
    categories: ["networking", "tunnel", "development"],
    tier: "verified",
    description: "Secure tunnels to localhost for development and testing."
  },
  {
    slug: "cloudflared",
    name: "cloudflared",
    vendor: { name: "Cloudflare", domain: "cloudflare.com", verified: true },
    repo: "https://github.com/cloudflare/cloudflared",
    docs: "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/",
    install: { brew: "cloudflared" },
    capabilities: { jsonOutput: true, auth: ["env:TUNNEL_TOKEN"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["networking", "tunnel", "cloudflare"],
    tier: "verified",
    description: "Cloudflare Tunnel client - expose local services securely."
  },
  // Database tools
  {
    slug: "pgcli",
    name: "pgcli",
    vendor: { name: "pgcli", domain: "pgcli.com", verified: false },
    repo: "https://github.com/dbcli/pgcli",
    docs: "https://www.pgcli.com/docs",
    install: { brew: "pgcli", pip: "pgcli" },
    capabilities: { jsonOutput: false, auth: ["env:PGPASSWORD"], idempotent: false, interactive: true, streaming: true },
    agentScores: { jsonOutput: 3, nonInteractive: 3, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 7,
    categories: ["database", "postgresql", "tui"],
    tier: "community",
    description: "Postgres CLI with autocomplete and syntax highlighting."
  },
  {
    slug: "mycli",
    name: "mycli",
    vendor: { name: "dbcli", domain: "mycli.net", verified: false },
    repo: "https://github.com/dbcli/mycli",
    docs: "https://www.mycli.net/docs",
    install: { brew: "mycli", pip: "mycli" },
    capabilities: { jsonOutput: false, auth: ["env:MYSQL_PWD"], idempotent: false, interactive: true, streaming: true },
    agentScores: { jsonOutput: 3, nonInteractive: 3, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 7,
    categories: ["database", "mysql", "tui"],
    tier: "community",
    description: "MySQL CLI with autocomplete and syntax highlighting."
  },
  {
    slug: "litecli",
    name: "litecli",
    vendor: { name: "dbcli", domain: "litecli.com", verified: false },
    repo: "https://github.com/dbcli/litecli",
    docs: "https://litecli.com/",
    install: { brew: "litecli", pip: "litecli" },
    capabilities: { jsonOutput: false, auth: [], idempotent: false, interactive: true, streaming: true },
    agentScores: { jsonOutput: 3, nonInteractive: 3, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 7,
    categories: ["database", "sqlite", "tui"],
    tier: "community",
    description: "SQLite CLI with autocomplete and syntax highlighting."
  },
  {
    slug: "dbeaver-cli",
    name: "DBeaver CLI",
    vendor: { name: "DBeaver", domain: "dbeaver.io", verified: false },
    repo: "https://github.com/dbeaver/dbeaver",
    docs: "https://dbeaver.com/docs/wiki/",
    install: { brew: "dbeaver-community" },
    capabilities: { jsonOutput: false, auth: ["connection strings"], idempotent: true, interactive: true, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 3, tokenEfficiency: 3, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 6,
    categories: ["database", "gui", "universal"],
    tier: "community",
    description: "Universal database tool and SQL client."
  },
  // File tools
  {
    slug: "rsync",
    name: "rsync",
    vendor: { name: "rsync", domain: "rsync.samba.org", verified: true },
    repo: "https://github.com/WayneD/rsync",
    docs: "https://rsync.samba.org/documentation.html",
    install: { brew: "rsync", apt: "rsync" },
    capabilities: { jsonOutput: false, auth: ["ssh"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["file-transfer", "backup", "sync"],
    tier: "verified",
    description: "Fast, versatile file copying tool for local and remote syncing."
  },
  {
    slug: "rclone",
    name: "rclone",
    vendor: { name: "rclone", domain: "rclone.org", verified: false },
    repo: "https://github.com/rclone/rclone",
    docs: "https://rclone.org/docs/",
    install: { brew: "rclone", apt: "rclone" },
    capabilities: { jsonOutput: true, auth: ["rclone.conf"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["file-transfer", "cloud-storage", "sync"],
    tier: "community",
    description: "Rsync for cloud storage - sync files to/from cloud providers."
  },
  {
    slug: "mc",
    name: "MinIO Client",
    vendor: { name: "MinIO", domain: "min.io", verified: true },
    repo: "https://github.com/minio/mc",
    docs: "https://min.io/docs/minio/linux/reference/minio-mc.html",
    install: { brew: "minio-mc" },
    capabilities: { jsonOutput: true, auth: ["mc config"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["storage", "s3", "object-storage"],
    tier: "verified",
    description: "MinIO Client for S3-compatible object storage."
  },
  {
    slug: "s3cmd",
    name: "s3cmd",
    vendor: { name: "s3tools", domain: "s3tools.org", verified: false },
    repo: "https://github.com/s3tools/s3cmd",
    docs: "https://s3tools.org/s3cmd",
    install: { brew: "s3cmd", pip: "s3cmd" },
    capabilities: { jsonOutput: false, auth: ["~/.s3cfg"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 3, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["storage", "s3", "aws"],
    tier: "community",
    description: "Command line tool for Amazon S3 and S3-compatible services."
  },
  // Image/Media processing
  {
    slug: "imagemagick",
    name: "ImageMagick",
    vendor: { name: "ImageMagick", domain: "imagemagick.org", verified: true },
    repo: "https://github.com/ImageMagick/ImageMagick",
    docs: "https://imagemagick.org/script/command-line-processing.php",
    install: { brew: "imagemagick", apt: "imagemagick" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["images", "conversion", "processing"],
    tier: "verified",
    description: "Create, edit, compose, or convert images from the command line."
  },
  {
    slug: "ffmpeg",
    name: "FFmpeg",
    vendor: { name: "FFmpeg", domain: "ffmpeg.org", verified: true },
    repo: "https://github.com/FFmpeg/FFmpeg",
    docs: "https://ffmpeg.org/documentation.html",
    install: { brew: "ffmpeg", apt: "ffmpeg" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["video", "audio", "conversion"],
    tier: "verified",
    description: "Complete solution for recording, converting and streaming audio and video."
  },
  {
    slug: "sox",
    name: "SoX",
    vendor: { name: "SoX", domain: "sox.sourceforge.io", verified: false },
    repo: "https://github.com/chirlu/sox",
    docs: "https://sox.sourceforge.io/Docs/Documentation",
    install: { brew: "sox", apt: "sox" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["audio", "conversion", "processing"],
    tier: "community",
    description: "Swiss Army knife of sound processing programs."
  },
  // More system tools
  {
    slug: "watch",
    name: "watch",
    vendor: { name: "procps", domain: "gitlab.com/procps-ng", verified: false },
    repo: "https://github.com/thlorenz/watch",
    docs: "https://linux.die.net/man/1/watch",
    install: { brew: "watch", apt: "procps" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 1, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 7,
    categories: ["system", "monitoring"],
    tier: "community",
    description: "Execute a program periodically, showing output fullscreen."
  },
  {
    slug: "viddy",
    name: "Viddy",
    vendor: { name: "sachaos", domain: "github.com/sachaos", verified: false },
    repo: "https://github.com/sachaos/viddy",
    docs: "https://github.com/sachaos/viddy#readme",
    install: { brew: "viddy", go: "github.com/sachaos/viddy" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 4, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 3 },
    agentScore: 7,
    categories: ["system", "monitoring", "tui"],
    tier: "community",
    description: "Modern watch command with time machine and diff support."
  },
  {
    slug: "entr",
    name: "entr",
    vendor: { name: "Eric Radman", domain: "eradman.com", verified: false },
    repo: "https://github.com/eradman/entr",
    docs: "https://eradman.com/entrproject/",
    install: { brew: "entr", apt: "entr" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 1, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["development", "watch", "automation"],
    tier: "community",
    description: "Run arbitrary commands when files change."
  },
  {
    slug: "watchexec",
    name: "watchexec",
    vendor: { name: "watchexec", domain: "watchexec.github.io", verified: false },
    repo: "https://github.com/watchexec/watchexec",
    docs: "https://watchexec.github.io/",
    install: { brew: "watchexec", cargo: "watchexec-cli" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["development", "watch", "automation"],
    tier: "community",
    description: "Execute commands when files change - alternative to entr."
  },
  // More devtools
  {
    slug: "direnv",
    name: "direnv",
    vendor: { name: "direnv", domain: "direnv.net", verified: false },
    repo: "https://github.com/direnv/direnv",
    docs: "https://direnv.net/",
    install: { brew: "direnv", apt: "direnv" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["development", "environment"],
    tier: "community",
    description: "Unclutter your .profile with per-directory environment variables."
  },
  {
    slug: "dotenv",
    name: "dotenv-cli",
    vendor: { name: "entropitor", domain: "github.com/entropitor", verified: false },
    repo: "https://github.com/entropitor/dotenv-cli",
    docs: "https://github.com/entropitor/dotenv-cli#readme",
    install: { npm: "dotenv-cli" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 5, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["development", "environment"],
    tier: "community",
    description: "CLI to load dotenv files and run commands with environment variables."
  },
  {
    slug: "envchain",
    name: "envchain",
    vendor: { name: "sorah", domain: "github.com/sorah", verified: false },
    repo: "https://github.com/sorah/envchain",
    docs: "https://github.com/sorah/envchain#readme",
    install: { brew: "envchain" },
    capabilities: { jsonOutput: false, auth: ["keychain"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 4 },
    agentScore: 9,
    categories: ["development", "secrets", "environment"],
    tier: "community",
    description: "Store secrets in OS keychain and load them into environment variables."
  },
  {
    slug: "chamber",
    name: "Chamber",
    vendor: { name: "Segment", domain: "github.com/segmentio", verified: true },
    repo: "https://github.com/segmentio/chamber",
    docs: "https://github.com/segmentio/chamber#readme",
    install: { brew: "chamber" },
    capabilities: { jsonOutput: true, auth: ["AWS credentials"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["secrets", "aws", "ssm"],
    tier: "verified",
    description: "CLI for managing secrets with AWS SSM Parameter Store."
  },
  {
    slug: "doppler",
    name: "Doppler CLI",
    vendor: { name: "Doppler", domain: "doppler.com", verified: true },
    repo: "https://github.com/DopplerHQ/cli",
    docs: "https://docs.doppler.com/docs/cli",
    install: { brew: "dopplerhq/cli/doppler" },
    capabilities: { jsonOutput: true, auth: ["env:DOPPLER_TOKEN"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["secrets", "environment", "configuration"],
    tier: "verified",
    description: "Universal secrets manager for developers."
  }
];

// Filter out existing tools
const toolsToAdd = newTools.filter(t => !existingSlugs.has(t.slug));

console.log(`Adding ${toolsToAdd.length} new tools (${newTools.length - toolsToAdd.length} skipped as duplicates)`);

// Add new tools
data.tools.push(...toolsToAdd);

// Update timestamp
data.updated = new Date().toISOString().split('T')[0];

// Write back
fs.writeFileSync(toolsPath, JSON.stringify(data, null, 2));

console.log(`Total tools now: ${data.tools.length}`);
console.log('Added tools:', toolsToAdd.map(t => t.slug).join(', '));
