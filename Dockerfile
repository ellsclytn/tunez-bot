FROM node:10-alpine

RUN mkdir -p /opt/app

WORKDIR /opt/app
COPY . /opt/app
RUN yarn

CMD [ "yarn", "dev" ]
