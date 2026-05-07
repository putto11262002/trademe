FROM docker.io/cloudflare/sandbox:0.9.3-python

WORKDIR /workspace

# Local container development needs explicit port exposure when services are used.
EXPOSE 3000

