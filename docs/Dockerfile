# TODO using dockerfile will not work for readthedocs ... 
# need to consider how to build for read the docs

FROM node:12 as img_autogen

COPY . /iav
WORKDIR /iav

# build aot first && install webdriver & pptr
# parallel build-aot, update webdriver and install pptr
RUN npm i && \
    npm run build-aot & \
    npm run wd -- update --versions.chrome=80.0.3987.106 & \
    npm i --no-save puppeteer@2.1.0

# install deploy folder
RUN cd deploy && \
    npm i

# auto generate screenshots
RUN npm run e2e -- --specs ./e2e/screenshots/gen.js


FROM python:3.7 as builder

COPY . /iav
WORKDIR /iav

RUN pip install mkdocs mkdocs-material mdx_truly_sane_lists

COPY --from=img_autogen /iav/docs/autogen_images /iav/docs/autogen_images

RUN mkdocs build

FROM nginx:alpine
COPY --from=builder /iav/site /usr/share/nginx/html
COPY --from=builder /iav/docs/nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
