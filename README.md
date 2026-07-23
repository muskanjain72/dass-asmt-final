<div align="center">
  <br />
  <h1>Campus Event Hub</h1>
  <p>
    A comprehensive MERN stack platform for managing university events, connecting students, organizers, and administrators in a seamless, role-based ecosystem.
  </p>
  
  <p>
    <a href="https://dass-asmt-final.vercel.app/" target="_blank"><strong>🌐 Live Frontend Website</strong></a>
    &nbsp;|&nbsp;
    <a href="https://dass-asmt-final.onrender.com" target="_blank"><strong>⚡ Live Backend Base API</strong></a>
  </p>
</div>

---

## 🌟 Overview

Campus Event Hub is a full-stack web application built with the MERN (MongoDB, Express, React, Node.js) stack. It solves the challenge of managing campus activities by providing a centralized, digital platform where students can discover events, organizers can promote and manage their activities, and administrators can oversee the entire ecosystem. From registration and ticketing to real-time updates and user management, this project is a one-stop solution for a vibrant campus life.

---

## ✨ Key Features

### For Participants
- **Event Discovery:** Browse a rich list of upcoming campus events, filterable by category, date, and eligibility.ma
- **Seamless Registration:** Register for events with a single click and fill out custom registration forms.
- **Personalized Dashboard:** View all registered events, tickets, and event history in one place.
- **Calendar Integration:** Export event details to your personal calendar (ICS format).
- **Follow Organizers:** Follow or unfollow official campus clubs and organizers to stay updated on their events.
- **Real-Time Event Forums:** Access persistent event discussion rooms powered by Socket.io to ask questions, chat with other registered participants, react with emojis, and read pinned announcements.
- **Merchandise Ordering & Payments:** Purchase event merchandise with customizable variants (e.g. size/color) and upload proof of payment screenshots for organizer verification.
- **Digital Ticket Delivery:** Receive email confirmations with inline QR codes and downloadable, self-contained HTML ticket attachments.

### For Organizers
- **Event Creation & Management:** A dedicated dashboard to create, update, and manage event details (supporting normal events and merchandise sales) with custom registration forms.
- **Participant Tracking:** View a list of registered participants for each event and download it as a CSV.
- **Real-time Statistics:** Monitor event performance with statistics on registrations and attendance.
- **Merchandise & Stock Controls:** Configure item stock quantities, individual purchase limits, variant selections, and verify uploaded proof of payments to approve or reject registrations.
- **Discussion Moderation:** Post announcements, react, pin messages, or delete inappropriate messages inside the real-time event forum.
- **In-Browser QR Scanner:** Verify check-ins at the venue using an integrated camera QR scanner (powered by `html5-qrcode`) to log attendance timestamps and prevent duplicate entries.

### For Admins
- **User & Club Management:** A powerful admin dashboard to provision organizer accounts as official campus club profiles, manage credentials, and disable or archive inactive clubs.
- **Platform Oversight:** View all users, events, and activities on the platform.
- **Secure Password Resets:** Review organizer reset requests, approving them to trigger crypto-secure temporary passwords dispatched directly via Nodemailer.

---
### ☁️ Media Storage

- **Cloudinary Integration:** All event images and user-uploaded media are stored securely on Cloudinary.
- Images are uploaded via the backend using Cloudinary’s API.
- Only image URLs are stored in MongoDB, keeping the database lightweight.
- Optimized delivery through Cloudinary’s built-in CDN.

---

## 🛠️ Tech Stack & Architecture

This project uses the MERN stack, chosen for its flexibility, scalability, and rapid development capabilities.

| Layer         | Technology |
| :------------ | :------------------------------------------------- |
| **Frontend**  | `React` `Vite` `React Router` `Axios` `Context API` `Socket.io-client` `html5-qrcode` |
| **Backend**   | `Node.js` `Express` `MongoDB` `Mongoose` `JWT` `Bcrypt.js` `Socket.io` `Multer` `Nodemailer` `ics` |
| **DevOps**    | `Vite` `Nodemon` `ESLint` |

---
## 🏗️ System Architecture

The application follows a clean client-server architecture:

- **Frontend (React + Vite):** Handles UI rendering and communicates with backend APIs using Axios. Supports real-time room communication via Socket.io-client.
- **Backend (Node + Express):** Manages authentication, Socket.io rooms, business logic, file uploads, and database operations.
- **Database (MongoDB):** Stores users, events, registrations, tickets, messages, and metadata.
- **Cloudinary:** Stores event images, banners, and payment proof assets.
- **JWT-based Auth Flow:** Stateless authentication using signed tokens.

This separation ensures scalability, maintainability, and clean role-based access control.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v14.x or newer)
- npm (v6.x or newer)
- MongoDB (local instance or a cloud-based service like MongoDB Atlas)

### Installation & Setup

1.  **Clone the Repository**
    ```sh
    git clone git@github.com:muskanjain72/dass-asmt-final.git
    cd dass-asmt-final
    ```

2.  **Backend Setup**
    ```sh
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and add your environment variables:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key

    PORT=5000

    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    EMAIL_USER=your_email_address
    EMAIL_PASS=your_email_password_or_app_password
    ```

3.  **Frontend Setup**
    ```sh
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the Backend Server**
    Open a terminal in the `backend` directory and run:
    ```sh
    npm start
    ```
    The server will be live at `http://localhost:5000`.

2.  **Start the Frontend Client**
    In a separate terminal, navigate to the `frontend` directory and run:
    ```sh
    npm run dev
    ```
    The application will open in your browser at `http://localhost:5173`.

---

## 🔐 Security & Authentication

Security is a top priority. The application implements the following measures:

- **Password Hashing:** All user passwords are securely hashed using `bcryptjs` before being stored in the database.
- **JWT Authentication:** Protected API routes are secured using JSON Web Tokens (JWT). The token is passed in the authorization header for every request to a protected endpoint.
- **Role-based Access Control (RBAC):** Both backend routes and frontend components are protected based on user roles (participant, organizer, admin), ensuring users can only access features relevant to their permissions.
- **Environment Variables:** Sensitive information like database connection strings and JWT secrets are stored securely in `.env` files and are not exposed in the source code.
- **Secure Media Handling:** Images and payment proofs are stored externally using Cloudinary.
- **Email Integration:** Secure temporary credentials and ticket notifications are handled via Nodemailer.

---


## 📌 Future Enhancements

-  **Payment Gateway Integration** Enable secure online payments for paid events using platforms like Stripe or Razorpay.

- **Event Analytics Dashboard**  Advanced analytics with visual charts for registrations, attendance trends, and organizer performance.

-  **Push Notifications**  Real-time notifications for event reminders, updates, and announcements.

- **Mobile App Version**  Develop a cross-platform mobile application for improved accessibility and engagement.
