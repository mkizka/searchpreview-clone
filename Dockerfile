FROM node:16

# install chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmour -o /usr/share/keyrings/google-keyring.gpg && \
  sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' && \
  apt update && apt install -y google-chrome-stable

COPY preview/package.json ./
RUN yarn

COPY preview ./
EXPOSE 3000
CMD yarn start
