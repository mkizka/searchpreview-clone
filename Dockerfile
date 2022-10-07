FROM node:16

# https://seri.hatenablog.com/entry/2020/10/04/012459
RUN apt update && apt install -y libgtk-3.0 libgbm-dev libnss3 libatk-bridge2.0-0 libasound2

WORKDIR /code
COPY preview/package.json ./
RUN yarn

COPY preview ./
EXPOSE 3000
CMD yarn start
