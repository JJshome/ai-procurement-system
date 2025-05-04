FROM node:16-alpine

WORKDIR /app

# 패키지 설치에 필요한 의존성
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://localhost:8000

# 포트 노출
EXPOSE 3000

# 개발 서버 실행
CMD ["npm", "start"]

# 프로덕션 빌드 및 배포 시에는 아래 명령어 사용
# RUN npm run build
# FROM nginx:alpine
# COPY --from=0 /app/build /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
