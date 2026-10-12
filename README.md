<p align="center">
  <a href="#[your-project-name]">
    <img src="./assets/logo.png" alt="Team Logo" width="160" height="160" style="border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.35);" />
  </a>
</p>

<h1 align="center">Forensic Medicine Database System (FMDBS)</h1>

<p align="center">
  <strong>CO 2050 — Database System Module Project</strong><br />
  Computer Engineering | Faculty of Engineering | University of Peradeniya</p>

<p align="center">
  <em>Designed and engineered by <strong>Tira-miss-u</strong></em>
</p>

---


A comprehensive, scalable, and secure system for managing forensic medicine records, including Clinical Cases, Autopsy Cases, Specimen Logs, and Dispatch Reports. Built to modernize legacy MS Access databases into a normalized, RBAC-protected web application.

## 🚀 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), Vite, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Dockerized)
- **Testing**: Jest, Supertest

## 🛠️ Features

- **Robust Backend Architecture**: Express REST API following strict MVC patterns.
- **Role-Based Access Control (RBAC)**: JWT authentication with granular permissions across roles (`super_admin`, `doctor`, `clerk`, `lab_staff`, `photographer`).
- **Normalized Schema (3NF/BCNF)**: Architected from complex ER diagrams to ensure data integrity and remove redundancies.
- **Adversarial Resiliency**:
  - Comprehensive protection against SQL Injection via parameterized `pg` queries.
  - Strict Database constraints (Unique, Foreign Keys, Not Null).
  - State machine enforcement preventing invalid backward status transitions on cases.
  - `express-validator` schema validations to gracefully handle malformed data inputs.
- **Audit Logging**: Asynchronous tracking of user modifications across core tables.

## 📁 Project Structure

```
Forensic-Medicine-Database/
├── backend/
│   ├── src/
│   │   ├── config/       # DB Pool & Environment configs
│   │   ├── controllers/  # Core business logic handling
│   │   ├── db/           # Migrations, Seeds, and Scripts
│   │   ├── middleware/   # Auth, RBAC, Validation, Error Handling
│   │   ├── routes/       # Express route definitions
│   │   └── utils/        # Error mapping and async wrappers
│   ├── tests/            # Jest Suites (Integration, Adversarial)
│   └── server.js         # Entry point
├── src/                  # Frontend Vite Source code (Vanilla JS)
├── index.html            # Main UI Template
└── package.json
```

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imaadh-ifthi/Forensic-Medicine-Database.git
   cd Forensic-Medicine-Database
   ```

2. **Setup Frontend:**
   ```bash
   npm install
   npm run dev
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_HOST=127.0.0.1
   DB_PORT=5433
   DB_NAME=fmdbs
   JWT_SECRET=super_secret_jwt_signature_key_2026
   JWT_EXPIRES_IN=24h
   ```

5. **Start PostgreSQL Container (if using Docker)**:
   ```bash
   docker-compose up -d
   ```

6. **Run Database Migrations & Seeds**:
   Navigate to `backend/` and execute the migration script to build the 3NF schemas and populate realistic test data:
   ```bash
   node src/db/migrate.js
   ```

7. **Run the API**:
   ```bash
   npm run dev
   ```

## 🧪 Testing

The backend contains a rigorous, adversarial `Jest` suite covering Auth Bypass attempts, Data Integrity failures, Concurrency/Race condition handling, and complete Integration workflows.

To run the test suite:
```bash
cd backend
npm test
```

## 🧑‍⚕️ Dummy Accounts (Seed Data)

After running the seed script, you can log in using the following test accounts:
- **Admin**: `admin` / `password123`
- **Doctor**: `dr_ameen` / `password123`
- **Clerk**: `clerk1` / `password123`

## 📝 License

Internal Project.
