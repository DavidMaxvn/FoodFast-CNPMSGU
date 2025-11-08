#!/bin/bash
cd "$(dirname "$0")"
mvn spring-boot:run -Dspring-boot.run.profiles=dev
