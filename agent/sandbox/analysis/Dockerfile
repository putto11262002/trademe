FROM docker.io/cloudflare/sandbox:0.9.3-python

WORKDIR /workspace

COPY sdk /opt/pholio-sdk

RUN python3 -m pip install --no-cache-dir \
  /opt/pholio-sdk \
  numpy \
  pandas \
  scipy \
  statsmodels \
  scikit-learn

# Local container development needs explicit port exposure when services are used.
EXPOSE 3000
