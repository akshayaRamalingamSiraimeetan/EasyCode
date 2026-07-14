FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
        gcc \
        g++ \
        python3 \
        openjdk-21-jdk \
        make \
        time \
        procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Create a non-root user and hand over /workspace
RUN useradd --create-home --shell /bin/bash runner \
    && chown -R runner:runner /workspace

USER runner

CMD ["bash"]