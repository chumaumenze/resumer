FROM ubuntu:20.04

WORKDIR /app

#ENV LANG="en_US.UTF-8"
#ENV LC_ALL="en_US.UTF-8"
#ENV LC_CTYPE="en_US.UTF-8"
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y zip python3 \
    python3-pip texlive-latex-base texlive-fonts-recommended \
    texlive-fonts-extra texlive-latex-extra

#RUN mkdir -p downloads/packages/lib && cd downloads && \
#    cp -a
#
#RUN zip -r9 packages.zip downloads/*/usr/lib64/*


#RUN apt-get update && apt-get install -y python3 python3-pip
#RUN python3.8 -m pip install --upgrade pip && \
#    python3.8 -m pip install pipenv
#
##COPY Pipfile Pipfile.lock /app/
#RUN pwd && ls -asl .
#RUN pipenv install --system --deploy --ignore-pipfile
#RUN echo `pipenv --venv`
#
##COPY . /app/
#
##RUN ./bundle.sh
