FROM centos:7

WORKDIR /app

# Install zip and other utilities
RUN yum install -y zip fontconfig-devel \
    graphite2-devel harfbuzz-devel freetype-devel glib2-devel cairo-devel \
    libicu-devel openssl-devel zlib-devel libpng-devel && \
    yum clean all

## Extract linux binary dependencies for AWS Lambda Layer
RUN mkdir -p packages/lib && cp -a /usr/lib64/* packages/lib/ && \
    cd packages && zip -r9 ../packages.zip lib

# Install Build tools
#RUN yum groupinstall -y 'Development Tools'
RUN yum install -y gcc gcc-c++ make

## Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

COPY . /app/

RUN $HOME/.cargo/bin/cargo build --release
RUN zip -j -r9 rust_bootstrap.zip ./target/release/bootstrap && \
    $HOME/.cargo/bin/cargo clean

# TODO: Upload Library and packages to Lambda Layers
# TODO: Upload bootstrap to Lambda

RUN rm -rf packages
