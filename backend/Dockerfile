# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# We copy project files and restore packages
COPY ["GymCore.Api/GymCore.Api.csproj", "GymCore.Api/"]
COPY ["GymCore.Application/GymCore.Application.csproj", "GymCore.Application/"]
COPY ["GymCore.Infrastructure/GymCore.Infrastructure.csproj", "GymCore.Infrastructure/"]
COPY ["GymCore.Domain/GymCore.Domain.csproj", "GymCore.Domain/"]
RUN dotnet restore "GymCore.Api/GymCore.Api.csproj"

COPY . .
WORKDIR "/src/GymCore.Api"
RUN dotnet publish "GymCore.Api.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "GymCore.Api.dll"]