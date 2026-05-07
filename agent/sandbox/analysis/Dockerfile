FROM docker.io/cloudflare/sandbox:0.9.3-python

WORKDIR /workspace

RUN python3 -m pip install --no-cache-dir \
  numpy \
  pandas \
  scipy \
  statsmodels \
  scikit-learn

# Local container development needs explicit port exposure when services are used.
EXPOSE 3000
