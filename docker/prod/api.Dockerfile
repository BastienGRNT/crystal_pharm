# L'API C# (app/api). Le contexte est la racine du dépôt.
FROM mcr.microsoft.com/dotnet/sdk:9.0.320@sha256:7e3a4bd66701a451823db2028154ae16ff191bc452596ba618ef4d0c58f9cd01 AS build
WORKDIR /source
COPY app/api/ ./
RUN dotnet publish CrystalPharm.Api/CrystalPharm.Api.csproj --configuration Release --output /publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0.22@sha256:8bbd3f6fcc157792d96f0932107d9d435df814a2c058ce2891a267fe341dea1a
ENV ASPNETCORE_URLS=http://+:8080 DOTNET_gcServer=0
WORKDIR /srv/api
COPY --from=build /publish ./
RUN mkdir -p /var/lib/prescriptions && chown app:app /var/lib/prescriptions
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "CrystalPharm.Api.dll"]
