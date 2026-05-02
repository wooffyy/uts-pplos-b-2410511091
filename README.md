# Sistem Pemesanan Tiket Event

**UTS Pembangunan Perangkat Lunak Berorientasi Service (SE.2) — Kelas B**

Universitas Pembangunan Nasional "Veteran" Jakarta — Fakultas Ilmu Komputer

- Nama: Muhammad Wahfiuddin
- NIM: 2410511091
- Kelas: B

Demo Video: https://youtu.be/_t9td_lMuyQ?si=Hbt3UPA2S18wS7TX

---

## Deskripsi Sistem

Sistem ini adalah aplikasi pemesanan tiket event berbasis arsitektur microservice. Pengguna dapat mendaftar event, memilih kategori tiket, melakukan checkout, membayar, dan mendapatkan e-ticket dengan QR code yang dapat divalidasi di pintu masuk.

Sistem dibangun dengan minimal 3 microservice independen yang saling berkomunikasi melalui REST API, ditambah 1 API Gateway sebagai single entry point di port 3000.

---

## Arsitektur Sistem

```
Client (Postman / Browser)
         |
         v
   [API Gateway] port 3000 - Node.js / Express
         |
         +--------------+---------------+
         |              |               |
         v              v               v
  [Auth Service]  [Event Service]  [Order Service]
   port 3001       port 3002        port 3003
   Node.js         Laravel 11       Node.js
   MySQL           MySQL            MySQL
```

Setiap service memiliki database terpisah. Tidak ada tabel yang diakses bersama secara langsung. Komunikasi antar-service dilakukan melalui HTTP internal.

Justifikasi pemisahan service:
- Auth Service berdiri sendiri karena bertanggung jawab penuh atas identitas pengguna dan token, dapat diganti atau di-scale tanpa memengaruhi domain lain.
- Event Service dibangun dengan PHP (Laravel 11) sebagai service yang mengelola data event dan tiket, dikonsumsi oleh Order Service melalui inter-service call.
- Order Service memiliki bounded context tersendiri antara lain pemesanan, pembayaran, dan validasi tiket fisik, termasuk pembuatan QR code.

---

## Peta Routing (Gateway ke Service)

| Method | Path | Service Tujuan | Auth |
|--------|------|----------------|------|
| POST | /auth/register | Auth Service | Public |
| POST | /auth/login | Auth Service | Public |
| POST | /auth/refresh | Auth Service | Public |
| POST | /auth/logout | Auth Service | Protected |
| GET | /auth/whoami | Auth Service | Protected |
| GET | /auth/github | Auth Service | Public |
| GET | /auth/github/callback | Auth Service | Public |
| GET | /events | Event Service | Public |
| GET | /events/:id | Event Service | Public |
| POST | /events | Event Service | Protected |
| PUT | /events/:id | Event Service | Protected |
| DELETE | /events/:id | Event Service | Protected |
| GET | /events/:id/tickets | Event Service | Public |
| POST | /events/:id/tickets | Event Service | Protected |
| POST | /orders/checkout | Order Service | Protected |
| GET | /orders | Order Service | Protected |
| GET | /orders/:id | Order Service | Protected |
| POST | /orders/:id/pay | Order Service | Protected |
| GET | /orders/:id/ticket | Order Service | Protected |
| POST | /orders/validate-ticket | Order Service | Protected |

---
## Tech Stack

| Komponen | Stack |
|----------|-------|
| API Gateway | Node.js, Express, http-proxy-middleware, express-rate-limit, jsonwebtoken |
| Auth Service | Node.js, Express, MySQL, bcrypt, jsonwebtoken, uuid |
| Event Service | PHP 8.2, Laravel 11 (MVC: Model, Controller, FormRequest, Route) |
| Order Service | Node.js, Express, MySQL, jsonwebtoken, qrcode, uuid |
| Database | MySQL 8 (masing-masing service memiliki database terpisah) |

---

## Cara Menjalankan

### Prasyarat

- Node.js >= 18
- PHP >= 8.2
- Laravel 11
- Composer 2.8.9
- MySQL 8
- npm 11+

### 1. Clone Repository

```bash
git clone https://github.com/wooffyy/uts-pplos-b-2410511091.git
cd uts-pplos-b-2410511091
```

### 2. Setup Environment Variables

Salin dan isi file `.env` untuk setiap service:

```bash
cp services/auth-service/.env.example services/auth-service/.env
cp services/event-service/.env.example services/event-service/.env
cp services/order-service/.env.example services/order-service/.env
cp gateway/.env.example gateway/.env
```

Variabel yang wajib diisi:

**Auth Service (`services/auth-service/.env`)**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=auth_db
DB_USER=root
DB_PASS=

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=604800000

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

**Event Service (`services/event-service/.env`)**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_db
DB_USERNAME=root
DB_PASSWORD=
```

**Order Service (`services/order-service/.env`)**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_db
DB_USER=root
DB_PASS=

EVENT_SERVICE_URL=http://localhost:3002
JWT_SECRET=your_jwt_secret_key
```

**Gateway (`gateway/.env`)**
```
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
EVENT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
JWT_SECRET=your_jwt_secret_key
```

### 3. Setup Database

Buat tiga database di MySQL:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE event_db;
CREATE DATABASE order_db;
```

### 4. Jalankan Auth Service (port 3001)

```bash
cd services/auth-service
npm install
npm migrate
npm start
```

### 5. Jalankan Event Service (port 3002)

```bash
cd services/event-service
composer install
php artisan key:generate
php artisan migrate
php artisan serve --port=3002
```

### 6. Jalankan Order Service (port 3003)

```bash
cd services/order-service
npm install
npm migrate
npm start
```

### 7. Jalankan API Gateway (port 3000)

```bash
cd gateway
npm install
npm start
```

Seluruh request diarahkan ke `http://localhost:3000`.

---

## GitHub OAuth Setup

1. Buka https://github.com/settings/developers
2. Pilih "New OAuth App"
3. Isi:
   - Application name: UTS PPLOS Event Ticket
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3001/auth/github/callback
4. Salin Client ID dan Client Secret ke `.env` Auth Service

Flow login GitHub: `GET /auth/github` -> redirect ke GitHub -> callback -> JWT di-generate.

---

## Fitur Utama

**Auth Service**
- Register dan login berbasis email + password dengan JWT
- Access token expire 15 menit, refresh token expire 7 hari
- Logout dengan blacklist token (berdasarkan `jti`)
- GitHub OAuth 2.0 dengan Authorization Code Flow
- User GitHub tersimpan dengan flag `oauth_provider = 'github'`, menyimpan nama, email, dan avatar

**Event Service (PHP - Laravel 11)**
- CRUD event dengan validasi input melalui FormRequest
- Pembuatan kategori tiket per event
- Listing event dengan paginasi (`page`, `per_page`) dan filter (`location`, `status`)
- Hanya pemilik event yang dapat mengubah atau menghapus event
- Dikonsumsi oleh Order Service untuk pengecekan dan pengurangan kuota tiket

**Order Service**
- Checkout tiket dengan pengurangan kuota melalui inter-service call ke Event Service
- Pembayaran order menghasilkan payment record
- E-ticket dengan QR code berformat base64 (`data:image/png;base64,...`)
- Validasi tiket di pintu masuk: cek `is_used`, tandai terpakai, catat waktu validasi
- Proteksi akses: hanya pemilik order yang dapat melihat order miliknya

**API Gateway**
- Single entry point semua request di port 3000
- Routing berdasarkan prefix path ke service tujuan
- JWT validation middleware sebelum meneruskan request ke protected endpoint
- Rate limiting 60 request per menit per IP

---

## Postman Collection

File collection tersedia di folder `/postman/collection.json`.

Langkah penggunaan:
1. Import file ke Postman
2. Set variabel `base_url` ke `http://localhost:3000`
3. Jalankan request secara berurutan mulai dari folder `1. Auth Service`

Collection mencakup 73 test case yang meliputi skenario sukses dan error untuk Auth Service, Event Service, dan Order Service.

---

## Struktur Repository

```
uts-pplos-b-2410511091/
├── docs/
│   └── laporan-uts.pdf
├── gateway/
│   └── index.js
├── poster/
│   ├── poster-uts.pdf
│   └── poster-uts.png
├── postman/
│   ├── screenshot/
│   └── collection.json
├── services/
│   ├── auth-service/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── oauthController.js
│   │   ├── models/
│   │   │   ├── BlacklistedToken.js
│   │   │   ├── RefreshToken.js
│   │   │   ├── User.js
│   │   │   ├── db.js
│   │   │   └── migrate.js
│   │   ├── routes/
│   │   │   └── route.js
│   │   ├── utils/
│   │   │   ├── checkBlacklist.js
│   │   │   └── generateToken.js
│   │   ├── .env.example
│   │   ├── index.js
│   ├── event-service/
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── EventController.php
│   │   │   │   │   └── TicketController.php
│   │   │   │   ├── Middleware/
│   │   │   │   │   └── EnsureGatewayAuth.php
│   │   │   │   └── Requests/
│   │   │   │       ├── StoreEventRequest.php
│   │   │   │       ├── StoreTicketRequest.php
│   │   │   │       └── UpdateEventRequest.php
│   │   │   └── Models/
│   │   │       ├── Event.php
│   │   │       └── Ticket.php
│   │   ├── bootstrap/
│   │   │   └── app.php 
│   │   ├── database/
│   │   │   └── migrations/
│   │   │       ├── 2026_04_28_051815_create_table_event.php
│   │   │       └── 2026_04_28_115928_create_table_tickets.php
│   │   ├── routes/
│   │   │   └── api.php
│   │   ├── .env.example
│   └── order-service/
│       ├── controllers/
│       │   ├── itemController.js
│       │   ├── orderController.js
│       │   └── paymentController.js
│       ├── models/
│       │   ├── Order.js
│       │   ├── OrderItem.js
│       │   ├── Payment.js
│       │   ├── ValidatedTicket.js
│       │   ├── db.js
│       │   └── migrate.js
│       ├── routes/
│       │   └── orderRoutes.js
│       ├── .env.example
└── README.md
```


