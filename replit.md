# FoodFast Drone Delivery - Replit Setup

## Project Overview
FoodFast Drone Delivery is a full-stack food delivery system with drone delivery capabilities. The system includes customer ordering, merchant management, admin dashboard, and real-time drone tracking.

## Tech Stack
- **Frontend**: React 18.2 with TypeScript, Material-UI, Redux Toolkit, React Router, Leaflet maps
- **Backend**: Spring Boot 3.2.4, Java 17, Maven, Spring Security, JWT, WebSocket, JPA/Hibernate
- **Database**: MySQL (configured in application.properties)
- **Payment**: VNPay integration
- **Image Storage**: Cloudinary
- **Real-time**: WebSocket for drone tracking

## Project Structure
```
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── pages/         # Customer, Merchant, and Admin pages
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── components/    # Reusable components
│   └── package.json
├── backend/               # Spring Boot application  
│   ├── src/main/java/com/fastfood/management/
│   │   ├── controller/    # REST controllers
│   │   ├── service/       # Business logic
│   │   ├── repository/    # Data access
│   │   ├── entity/        # JPA entities
│   │   ├── config/        # Configuration classes
│   │   └── security/      # JWT authentication
│   └── pom.xml
└── screenshots/           # Project screenshots
```

## Recent Changes (Replit Setup)
- Created `pom.xml` for Maven build configuration with all dependencies
- Updated CORS configuration to support Replit domains
- Created `.env` files for frontend with port 5000 configuration
- Updated VNPay return URL to use Replit domain
- Added Java/Maven entries to `.gitignore`
- Configured workflow for frontend on port 5000

## Running the Application

### Frontend (Port 5000)
The frontend workflow is already configured and runs automatically:
- URL: https://REPLIT_DEV_DOMAIN (served via Replit webview)
- The dev server is configured to bind to 0.0.0.0:5000
- Environment configured via `.env` file

### Backend (Port 8080)
To run the backend manually:
```bash
cd backend
bash run-backend.sh
```
Or using Maven directly:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend API is available at: http://localhost:8080/api

## Database Setup
The application requires MySQL database. Configure in `backend/src/main/resources/application.properties`:
- Database: fastfood_db
- Default credentials: root/123456 (change for production)
- The database is created automatically on first run

## Environment Variables
- `REPLIT_DEV_DOMAIN`: Automatically set by Replit
- `CLOUDINARY_*`: Optional, defaults are set in application.properties
- Backend uses localhost:8080, Frontend uses port 5000

## API Documentation
Once the backend is running, access Swagger UI at:
http://localhost:8080/api/swagger-ui/index.html

## Key Features
- Customer portal: Browse restaurants, order food, track deliveries
- Merchant portal: Manage menu, inventory, orders, staff
- Admin dashboard: Manage stores, menus, orders, drone fleet
- Real-time drone tracking with GPS coordinates
- Payment integration with VNPay
- JWT-based authentication
- WebSocket for live order/delivery updates

## User Roles
- CUSTOMER: Browse and order food
- MERCHANT/STAFF: Manage store operations
- ADMIN: System-wide management

## Development Notes
- Frontend uses Create React App (CRA) 5.0.1
- Backend uses Spring Boot 3.2.4 with Java 17
- MapStruct for DTO mapping
- Lombok for boilerplate reduction
- Flyway for database migrations (in db/migration/)

## Next Steps
1. Start MySQL database service
2. Run backend: `cd backend && bash run-backend.sh`
3. Frontend runs automatically via workflow
4. Access application at Replit webview URL
5. Initial data can be seeded via Swagger UI or SQL scripts

## Deployment
Use the Replit deployment configuration for production deployment. The build process will compile both frontend and backend.
