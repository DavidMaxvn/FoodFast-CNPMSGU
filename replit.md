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

### Known Issue: Memory Constraints
The React dev server may fail to run continuously in Replit's free tier due to memory constraints. The frontend compiles successfully but may crash after compilation. Here are the solutions:

**Option 1: Build and Serve (Recommended for Replit)**
```bash
cd frontend
npm run build
npx serve -s build -p 5000
```

**Option 2: Dev Mode (May require higher Replit tier)**
The frontend workflow will attempt to run the dev server automatically on port 5000.

**Option 3: Use Deployment**
Click the "Publish" button in Replit to deploy to production where more resources are available.

### Frontend (Port 5000)
The frontend workflow is configured but may fail due to memory:
- URL: https://REPLIT_DEV_DOMAIN (served via Replit webview)
- The dev server is configured to bind to 0.0.0.0:5000
- Environment configured via `.env` file
- If workflow fails, use the build + serve method above

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

### Required for Backend
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name (required for image uploads)
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

### Frontend Configuration
- `REACT_APP_API_BASE_URL`: Backend API URL  
  - Development default: `http://localhost:8080/api` (set in `.env`)
  - Production default: `/api` (set in `.env.production`)
  - **For Replit deployment**: If frontend and backend are on different URLs, override in Replit Secrets

### Automatically Set by Replit
- `REPLIT_DEV_DOMAIN`: Used for CORS and VNPay callbacks
- Backend uses port 8080, Frontend uses port 5000

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

## Next Steps to Get Running

### Quick Start (Recommended)
1. **Set up MySQL Database**: Install and configure MySQL locally or use a cloud MySQL service
   - Update `backend/src/main/resources/application.properties` with your database credentials
   - The database `fastfood_db` will be created automatically on first run

2. **Start the Backend**:
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   The backend will start on port 8080 with API at `/api`

3. **Build and Serve Frontend**:
   ```bash
   cd frontend
   npm run build
   npx serve -s build -p 5000
   ```
   This avoids memory issues with the dev server.
   
   **Note**: The production build uses `/api` for the API base URL (relative path), which works when the backend is accessible at the same domain. If running backend separately, set `REACT_APP_API_BASE_URL` before building.

4. **Access the Application**:
   - Frontend: https://REPLIT_DEV_DOMAIN
   - Backend API: http://localhost:8080/api
   - Swagger UI: http://localhost:8080/api/swagger-ui/index.html

5. **Seed Initial Data**:
   - Use the Swagger UI to create initial users, stores, and menu items
   - Or run SQL scripts from `backend/src/main/resources/db/migration/`

### Alternative: Manual Dev Server
If you have sufficient memory (Replit paid tier), you can run:
```bash
cd frontend
npm start
```

## Troubleshooting

### Frontend Won't Start
- **Issue**: "The build failed because the process exited too early"
- **Solution**: This is a memory constraint. Use the build + serve method above instead of dev server

### Backend Won't Start  
- **Issue**: Database connection errors
- **Solution**: Ensure MySQL is running and credentials in `application.properties` are correct
- **Alternative**: Use an H2 in-memory database for testing (requires pom.xml modification)

### CORS Errors
- The CORS configuration automatically detects Replit domain via `REPLIT_DEV_DOMAIN`
- If issues persist, check `WebSecurityConfig.java` and ensure the Replit domain is allowed

## Deployment
Click the "Publish" button in Replit to deploy. The deployment configuration:
- Builds the React frontend (`npm run build`)
- Runs backend on Spring Boot with production profile
- Serves frontend static files on port 5000
- Backend API runs on port 8080

**Before deploying:**
1. Set up a production MySQL database
2. Update `application-prod.properties` with production database credentials
3. **Set environment variables in Replit Secrets:**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `REACT_APP_API_BASE_URL` (set to your backend URL, e.g., `/api` if same domain)
4. Consider moving JWT secret and VNPay credentials to environment variables as well
