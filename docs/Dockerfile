FROM python:3.7 as builder

COPY . /iav
WORKDIR /iav

RUN pip install mkdocs mkdocs-material mdx_truly_sane_lists errandkun

RUN mkdocs build

FROM nginx:alpine
COPY --from=builder /iav/site /usr/share/nginx/html
COPY --from=builder /iav/docs/nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
