FROM amazonlinux:2.0.20200406.0

WORKDIR /app

RUN yum install -y python38 && \
    yum install -y python3-pip && \
    yum install -y zip && \
    yum clean all

COPY Pipfile Pipfile.lock /app/

RUN python3.8 -m pip install --upgrade pip && \
    python3.8 -m pip install pipenv

RUN pipenv install --system --deploy --ignore-pipfile

COPY . /app/

RUN ./bundle.sh
