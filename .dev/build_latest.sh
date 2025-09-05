docker build -t spiicytuna/flame -t "spiicytuna/flame:$1" -f .docker/Dockerfile . \
  && docker push spiicytuna/flame && docker push "spiicytuna/flame:$1"
