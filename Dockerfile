FROM node:24-alpine AS client
WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server
WORKDIR /src
COPY Banter.Api/Banter.Api.csproj Banter.Api/
RUN dotnet restore Banter.Api/Banter.Api.csproj
COPY Banter.Api/ Banter.Api/
RUN dotnet publish Banter.Api/Banter.Api.csproj -c Release -o /app --no-restore -p:SkipClientBuild=true

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=server /app ./
COPY --from=client /src/client/dist ./wwwroot
RUN mkdir -p /app/data /app/wwwroot/avatars /app/wwwroot/uploads \
    && chown -R $APP_UID /app/data /app/wwwroot/avatars /app/wwwroot/uploads
USER $APP_UID
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    ConnectionStrings__Default="Data Source=/app/data/banter.db"
EXPOSE 8080
ENTRYPOINT ["dotnet", "Banter.Api.dll"]
